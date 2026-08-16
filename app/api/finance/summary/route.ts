import { NextResponse } from "next/server"
import { db } from "@/db"
import {
    pharmacySales,
    pharmacySaleItems,
    medicines,
    purchaseOrders,
    invoices,
    invoiceItems,
    medicalActs,
    expenses
} from "@/db/schema"
import { gte, lte, and, ne, eq, sql } from "drizzle-orm"

const num = (v: string | null | undefined) => parseFloat(v || "0")
const round2 = (v: number) => Math.round(v * 100) / 100

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const fromParam = searchParams.get("from")
        const toParam = searchParams.get("to")

        const now = new Date()
        let fromDate: Date | null = null
        let toDate: Date | null = null

        if (fromParam) fromDate = new Date(fromParam)
        if (toParam) {
            toDate = new Date(toParam)
            toDate.setHours(23, 59, 59, 999)
        }
        // Default to current month when no range given
        if (!fromDate && !toDate) {
            fromDate = new Date(now.getFullYear(), now.getMonth(), 1)
        }

        const whereClause = (table: any) => {
            const conds: any[] = []
            if (fromDate) conds.push(gte(table.createdAt, fromDate))
            if (toDate) conds.push(lte(table.createdAt, toDate))
            return conds.length ? and(...conds) : undefined
        }
        // Invoices: exclude cancelled for revenue accuracy
        const whereClauseInvoices = () => {
            const conds: any[] = []
            if (fromDate) conds.push(gte(invoices.createdAt, fromDate))
            if (toDate) conds.push(lte(invoices.createdAt, toDate))
            conds.push(ne(invoices.status, "cancelled"))
            return and(...conds)
        }
        // Purchase orders use orderDate
        const whereClausePO = (table: any) => {
            const conds: any[] = []
            if (fromDate) conds.push(gte(table.orderDate, fromDate))
            if (toDate) conds.push(lte(table.orderDate, toDate))
            return conds.length ? and(...conds) : undefined
        }
        // Pharmacy sales use saleDate
        const whereClausePS = (table: any) => {
            const conds: any[] = []
            if (fromDate) conds.push(gte(table.saleDate, fromDate))
            if (toDate) conds.push(lte(table.saleDate, toDate))
            return conds.length ? and(...conds) : undefined
        }

        // 1. Pharmacy Sales Revenue
        const [pharmacyRevenueResult] = await db.select({
            total: sql<string>`sum(${pharmacySales.totalAmount})`
        }).from(pharmacySales).where(whereClausePS(pharmacySales))
        const pharmacyRevenue = num(pharmacyRevenueResult?.total)

        // 2. Medicine Entry Costs (Purchases)
        const [medicineCostsResult] = await db.select({
            total: sql<string>`sum(${purchaseOrders.totalAmount})`
        }).from(purchaseOrders).where(whereClausePO(purchaseOrders))
        const medicineCosts = num(medicineCostsResult?.total)

        // 3. Medical Acts Revenue (Invoices, excluding cancelled)
        const [actsRevenueResult] = await db.select({
            total: sql<string>`sum(${invoices.totalAmount})`
        }).from(invoices).where(whereClauseInvoices())
        const actsRevenue = num(actsRevenueResult?.total)

        // 4. Operational Expenses
        const [expensesResult] = await db.select({
            total: sql<string>`sum(${expenses.amount})`
        }).from(expenses).where(whereClause(expenses))
        const totalExpenses = num(expensesResult?.total)

        // 5. Detail per Medical Act
        const actsRows = await db.select({
            id: medicalActs.id,
            name: medicalActs.name,
            code: medicalActs.code,
            usageCount: sql<number>`count(${invoiceItems.id})::int`,
            invoiceCount: sql<number>`count(distinct ${invoices.id})::int`,
            revenue: sql<string>`sum(${invoiceItems.totalPrice})`,
        })
            .from(invoiceItems)
            .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
            .innerJoin(medicalActs, eq(invoiceItems.medicalActId, medicalActs.id))
            .where(whereClauseInvoices())
            .groupBy(medicalActs.id, medicalActs.name, medicalActs.code)
            .orderBy(sql`sum(${invoiceItems.totalPrice}) desc`)

        const acts = {
            total: round2(actsRows.reduce((s, r) => s + num(r.revenue), 0)),
            usageCount: actsRows.reduce((s, r) => s + (r.usageCount || 0), 0),
            invoiceCount: actsRows.reduce((s, r) => s + (r.invoiceCount || 0), 0),
            top: actsRows.length
                ? {
                    name: actsRows[0].name,
                    usageCount: actsRows[0].usageCount || 0,
                    revenue: num(actsRows[0].revenue),
                }
                : null,
            items: actsRows.map((r) => ({
                id: r.id,
                name: r.name,
                code: r.code,
                usageCount: r.usageCount || 0,
                invoiceCount: r.invoiceCount || 0,
                revenue: num(r.revenue),
            })),
        }

        // 6. Detail per Medicine
        const [pharmacyTxResult] = await db.select({
            tx: sql<number>`count(distinct ${pharmacySales.id})::int`
        }).from(pharmacySales).where(whereClausePS(pharmacySales))

        const pharmacyRows = await db.select({
            id: medicines.id,
            name: medicines.name,
            quantity: sql<string>`sum(${pharmacySaleItems.quantity})`,
            revenue: sql<string>`sum(${pharmacySaleItems.totalPrice})`,
        })
            .from(pharmacySaleItems)
            .innerJoin(pharmacySales, eq(pharmacySaleItems.saleId, pharmacySales.id))
            .innerJoin(medicines, eq(pharmacySaleItems.medicineId, medicines.id))
            .where(whereClausePS(pharmacySales))
            .groupBy(medicines.id, medicines.name)
            .orderBy(sql`sum(${pharmacySaleItems.totalPrice}) desc`)

        const pharmacy = {
            total: round2(pharmacyRows.reduce((s, r) => s + num(r.revenue), 0)),
            unitsSold: round2(pharmacyRows.reduce((s, r) => s + num(r.quantity), 0)),
            transactionCount: pharmacyTxResult?.tx || 0,
            top: pharmacyRows.length
                ? {
                    name: pharmacyRows[0].name,
                    quantity: num(pharmacyRows[0].quantity),
                    revenue: num(pharmacyRows[0].revenue),
                }
                : null,
            items: pharmacyRows.map((r) => ({
                id: r.id,
                name: r.name,
                quantity: num(r.quantity),
                revenue: num(r.revenue),
            })),
        }

        // Aggregate Data
        const totalRevenue = round2(pharmacyRevenue + actsRevenue)
        const totalCosts = round2(medicineCosts + totalExpenses)
        const netBalance = round2(totalRevenue - totalCosts)

        return NextResponse.json({
            data: {
                summary: {
                    totalRevenue,
                    totalCosts,
                    netBalance,
                    breakdown: {
                        pharmacy: round2(pharmacyRevenue),
                        medicalActs: round2(actsRevenue),
                        purchases: round2(medicineCosts),
                        expenses: round2(totalExpenses)
                    }
                },
                acts,
                pharmacy,
                from: fromParam || null,
                to: toParam || null,
            }
        })
    } catch (error: any) {
        console.error("Finance summary failed:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
