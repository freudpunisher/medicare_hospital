import { NextResponse } from "next/server"
import { db } from "@/db"
import { cashSessions, pharmacySales, payments, cashRegister } from "@/db/schema"
import { z } from "zod"
import { desc, eq, and, gte, lte, sql } from "drizzle-orm"

const openSessionSchema = z.object({
    cashRegisterId: z.string().uuid(),
    openingBalance: z.number().nonnegative(),
    openedBy: z.string().uuid(),
})

const closeSessionSchema = z.object({
    id: z.string().uuid(),
    physicalBalance: z.number().nonnegative(),
    closedBy: z.string().uuid(),
    notes: z.string().optional(),
})

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const status = searchParams.get("status")

        const data = await db.query.cashSessions.findMany({
            where: status && status !== "all" ? eq(cashSessions.status, status) : undefined,
            orderBy: desc(cashSessions.openedAt),
            with: {
                cashRegister: true
            }
        })

        return NextResponse.json({ data })
    } catch (error: any) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { action } = body

        if (action === "open") {
            const validated = openSessionSchema.parse(body.data)
            const [newSession] = await db.insert(cashSessions).values({
                cashRegisterId: validated.cashRegisterId,
                openingBalance: validated.openingBalance.toString(),
                openedBy: validated.openedBy,
                status: "open",
            }).returning()

            return NextResponse.json({ data: newSession })
        }

        if (action === "close") {
            const validated = closeSessionSchema.parse(body.data)

            // 1. Calculate Expected Balance
            const session = await db.query.cashSessions.findFirst({
                where: eq(cashSessions.id, validated.id)
            })

            if (!session) return NextResponse.json({ error: "Session introuvable" }, { status: 404 })

            const openedAt = session.openedAt
            const now = new Date()

            // Sum Pharmacy Sales (Cash) since openedAt
            // Note: For absolute precision, we'd filter by the user assigned to this register
            // but for now we'll sum all cash transactions in this timeframe for simplicity,
            // unless we want to filter by openedBy user.

            const [pharmacyRevenueResult] = await db.select({
                total: sql<string>`sum(${pharmacySales.totalAmount})`
            }).from(pharmacySales).where(and(
                eq(pharmacySales.paymentMethod, 'cash'),
                gte(pharmacySales.createdAt, openedAt)
            ))

            const [actsRevenueResult] = await db.select({
                total: sql<string>`sum(${payments.amount})`
            }).from(payments).where(and(
                eq(payments.paymentMethod, 'cash'),
                gte(payments.createdAt, openedAt)
            ))

            const pharmacyRevenue = parseFloat(pharmacyRevenueResult?.total || "0")
            const actsRevenue = parseFloat(actsRevenueResult?.total || "0")
            const expectedTotalIncome = pharmacyRevenue + actsRevenue
            const expectedBalance = parseFloat(session.openingBalance) + expectedTotalIncome - parseFloat(session.totalExpenses)

            const [closedSession] = await db.update(cashSessions).set({
                status: "closed",
                closedAt: now,
                closedBy: validated.closedBy,
                totalIncome: expectedTotalIncome.toString(),
                expectedBalance: expectedBalance.toString(),
                physicalBalance: validated.physicalBalance.toString(),
                notes: validated.notes
            }).where(eq(cashSessions.id, validated.id)).returning()

            return NextResponse.json({ data: closedSession })
        }

        return NextResponse.json({ error: "Action non supportée" }, { status: 400 })
    } catch (error: any) {
        console.error("Cash session action failed:", error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors.map((e) => e.message).join(". ") }, { status: 400 })
        }
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
