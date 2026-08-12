import { NextResponse } from "next/server"
import { db } from "@/db"
import {
    pharmacySales,
    purchaseOrders,
    invoices,
    expenses
} from "@/db/schema"
import { gte, lte, and, sql } from "drizzle-orm"

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
        const pharmacyRevenue = parseFloat(pharmacyRevenueResult?.total || "0")

        // 2. Medicine Entry Costs (Purchases)
        const [medicineCostsResult] = await db.select({
            total: sql<string>`sum(${purchaseOrders.totalAmount})`
        }).from(purchaseOrders).where(whereClausePO(purchaseOrders))
        const medicineCosts = parseFloat(medicineCostsResult?.total || "0")

        // 3. Medical Acts Revenue (Invoices)
        const [actsRevenueResult] = await db.select({
            total: sql<string>`sum(${invoices.totalAmount})`
        }).from(invoices).where(whereClause(invoices))
        const actsRevenue = parseFloat(actsRevenueResult?.total || "0")

        // 4. Operational Expenses
        const [expensesResult] = await db.select({
            total: sql<string>`sum(${expenses.amount})`
        }).from(expenses).where(whereClause(expenses))
        const totalExpenses = parseFloat(expensesResult?.total || "0")

        // Aggregate Data
        const totalRevenue = pharmacyRevenue + actsRevenue
        const totalCosts = medicineCosts + totalExpenses
        const netBalance = totalRevenue - totalCosts

        return NextResponse.json({
            data: {
                summary: {
                    totalRevenue,
                    totalCosts,
                    netBalance,
                    breakdown: {
                        pharmacy: pharmacyRevenue,
                        medicalActs: actsRevenue,
                        purchases: medicineCosts,
                        expenses: totalExpenses
                    }
                },
                from: fromParam || null,
                to: toParam || null,
            }
        })
    } catch (error: any) {
        console.error("Finance summary failed:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
