import { NextResponse } from "next/server"
import { db } from "@/db"
import { expenses } from "@/db/schema"
import { z } from "zod"
import { desc, eq, and, gte, lte } from "drizzle-orm"

const expenseSchema = z.object({
    description: z.string().min(1, "La description est obligatoire"),
    amount: z.number().positive("Le montant doit être positif"),
    category: z.string().min(1, "La catégorie est obligatoire"),
    cashSessionId: z.string().uuid().optional().nullable(),
})

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const category = searchParams.get("category")
        const startDate = searchParams.get("startDate")
        const endDate = searchParams.get("endDate")

        let whereClause = []
        if (category && category !== "all") {
            whereClause.push(eq(expenses.category, category))
        }
        if (startDate) {
            whereClause.push(gte(expenses.createdAt, new Date(startDate)))
        }
        if (endDate) {
            whereClause.push(lte(expenses.createdAt, new Date(endDate)))
        }

        const data = await db.query.expenses.findMany({
            where: whereClause.length > 0 ? and(...whereClause) : undefined,
            orderBy: desc(expenses.createdAt),
        })

        return NextResponse.json({ data })
    } catch (error: any) {
        console.error("Failed to fetch expenses:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const validatedData = expenseSchema.parse(body)

        const [newExpense] = await db.insert(expenses).values({
            description: validatedData.description,
            amount: validatedData.amount.toString(),
            category: validatedData.category,
            cashSessionId: validatedData.cashSessionId,
        }).returning()

        return NextResponse.json({ data: newExpense })
    } catch (error: any) {
        console.error("Failed to create expense:", error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors.map((e) => e.message).join(". ") }, { status: 400 })
        }
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
