import { NextResponse } from "next/server"
import { db } from "@/db"
import {
    pharmacySales,
    purchaseOrders,
    invoices,
    expenses
} from "@/db/schema"
import { gte, and, sql } from "drizzle-orm"

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const period = searchParams.get("period") || "month" // today, month, year, all

        const now = new Date("2026-06-14T15:00:07+02:00") // Using current system time
        let startDate: Date | null = null

        if (period === "today") {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        } else if (period === "month") {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        } else if (period === "year") {
            startDate = new Date(now.getFullYear(), 0, 1)
        }

        const whereClause = (table: any) => startDate ? gte(table.createdAt, startDate) : undefined
        // Purchase orders use orderDate
        const whereClausePO = (table: any) => startDate ? gte(table.orderDate, startDate) : undefined
        // Pharmacy sales use saleDate
        const whereClausePS = (table: any) => startDate ? gte(table.saleDate, startDate) : undefined

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
                period
            }
        })
    } catch (error: any) {
        console.error("Finance summary failed:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
