import { NextResponse } from "next/server"
import { db } from "@/db"
import { cashSessions, pharmacySales, payments, cashRegister, expenses } from "@/db/schema"
import { postAutoJournalEntry } from "@/lib/accounting"
import { z } from "zod"
import { desc, eq, and, sql } from "drizzle-orm"

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
        const openedBy = searchParams.get("openedBy")

        const conditions = []
        if (status && status !== "all") conditions.push(eq(cashSessions.status, status))
        if (openedBy) conditions.push(eq(cashSessions.openedBy, openedBy))

        const data = await db.query.cashSessions.findMany({
            where: conditions.length > 0 ? and(...conditions) : undefined,
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

            const existing = await db.query.cashSessions.findFirst({
                where: and(eq(cashSessions.openedBy, validated.openedBy), eq(cashSessions.status, "open"))
            })
            if (existing) {
                return NextResponse.json({ error: "Vous avez déjà une session ouverte. Veuillez la fermer avant d'en ouvrir une nouvelle." }, { status: 400 })
            }

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

            const session = await db.query.cashSessions.findFirst({
                where: eq(cashSessions.id, validated.id)
            })

            if (!session) return NextResponse.json({ error: "Session introuvable" }, { status: 404 })

            if (session.openedBy !== validated.closedBy) {
                return NextResponse.json({ error: "Seul l'utilisateur ayant ouvert cette session peut la fermer." }, { status: 403 })
            }

            const result = await db.transaction(async (tx) => {
                const now = new Date()

                // Sum Pharmacy Sales attached to this session
                const [pharmacyRevenueResult] = await tx.select({
                    total: sql<string>`sum(${pharmacySales.totalAmount})`
                }).from(pharmacySales).where(
                    eq(pharmacySales.cashSessionId, validated.id)
                )

                const [actsRevenueResult] = await tx.select({
                    total: sql<string>`sum(${payments.amount})`
                }).from(payments).where(and(
                    eq(payments.paymentMethod, 'cash'),
                    eq(payments.cashSessionId, validated.id)
                ))

                const [expensesResult] = await tx.select({
                    total: sql<string>`sum(${expenses.amount})`
                }).from(expenses).where(
                    eq(expenses.cashSessionId, validated.id)
                )

                const pharmacyRevenue = parseFloat(pharmacyRevenueResult?.total || "0")
                const actsRevenue = parseFloat(actsRevenueResult?.total || "0")
                const totalExpenses = parseFloat(expensesResult?.total || "0")
                const expectedTotalIncome = pharmacyRevenue + actsRevenue
                const expectedBalance = parseFloat(session.openingBalance) + expectedTotalIncome - totalExpenses

                const [closedSession] = await tx.update(cashSessions).set({
                    status: "closed",
                    closedAt: now,
                    closedBy: validated.closedBy,
                    totalIncome: expectedTotalIncome.toString(),
                    totalExpenses: totalExpenses.toString(),
                    expectedBalance: expectedBalance.toString(),
                    physicalBalance: validated.physicalBalance.toString(),
                    notes: validated.notes
                }).where(eq(cashSessions.id, validated.id)).returning()

                const difference = validated.physicalBalance - expectedBalance
                if (Math.abs(difference) >= 0.01) {
                    await postAutoJournalEntry(tx, {
                        eventType: difference > 0 ? "cash_session_surplus" : "cash_session_deficit",
                        amount: Math.abs(difference),
                        label: difference > 0
                            ? `Excédent de caisse (session ${validated.id.split("-")[0]})`
                            : `Déficit de caisse (session ${validated.id.split("-")[0]})`,
                        referenceType: "cash_session",
                        referenceId: validated.id,
                    })
                }

                return closedSession
            })

            return NextResponse.json({ data: result })
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
