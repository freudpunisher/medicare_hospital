import { NextResponse } from "next/server"
import { db } from "@/db"
import { cashSessions, pharmacySales, payments, expenses } from "@/db/schema"
import { eq, and, gte, sql } from "drizzle-orm"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: sessionId } = await params

        const session = await db.query.cashSessions.findFirst({
            where: eq(cashSessions.id, sessionId)
        })

        if (!session) return NextResponse.json({ error: "Session introuvable" }, { status: 404 })

        const openedAt = session.openedAt

        // Sum Pharmacy Sales (Cash) since openedAt
        const [pharmacyRevenueResult] = await db.select({
            total: sql<string>`sum(${pharmacySales.totalAmount})`
        }).from(pharmacySales).where(and(
            eq(pharmacySales.paymentMethod, 'cash'),
            gte(pharmacySales.createdAt, openedAt)
        ))

        // Sum Medical Act Payments (Cash) linked to this session
        const [actsRevenueResult] = await db.select({
            total: sql<string>`sum(${payments.amount})`
        }).from(payments).where(and(
            eq(payments.paymentMethod, 'cash'),
            eq(payments.cashSessionId, sessionId)
        ))

        // Sum Expenses linked to this session
        const [expensesResult] = await db.select({
            total: sql<string>`sum(${expenses.amount})`
        }).from(expenses).where(
            eq(expenses.cashSessionId, sessionId)
        )

        const pharmacyRevenue = parseFloat(pharmacyRevenueResult?.total || "0")
        const actsRevenue = parseFloat(actsRevenueResult?.total || "0")
        const totalExpenses = parseFloat(expensesResult?.total || "0")
        const expectedIncome = pharmacyRevenue + actsRevenue
        const expectedBalance = parseFloat(session.openingBalance) + expectedIncome - totalExpenses

        return NextResponse.json({
            data: {
                openingBalance: parseFloat(session.openingBalance),
                pharmacyRevenue,
                actsRevenue,
                totalExpenses,
                expectedIncome,
                expectedBalance
            }
        })
    } catch (error: any) {
        console.error("Failed to fetch expected total:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
