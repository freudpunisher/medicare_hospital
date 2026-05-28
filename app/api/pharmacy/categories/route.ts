import { NextResponse } from "next/server"
import { db } from "@/db"
import { medicineCategories } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { z } from "zod"

const categorySchema = z.object({
    name: z.string().min(1),
    description: z.string().optional(),
})

export async function GET() {
    try {
        const data = await db.query.medicineCategories.findMany({
            orderBy: desc(medicineCategories.createdAt)
        })
        return NextResponse.json({ data })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const validated = categorySchema.parse(body)
        const [newCategory] = await db.insert(medicineCategories).values(validated).returning()
        return NextResponse.json({ data: newCategory })
    } catch (error: any) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 })
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
