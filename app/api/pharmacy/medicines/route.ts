import { NextResponse } from "next/server"
import { db } from "@/db"
import { medicines } from "@/db/schema"
import { eq, desc } from "drizzle-orm"
import { z } from "zod"

const medicineSchema = z.object({
    name: z.string().min(1),
    genericName: z.string().optional().nullable(),
    categoryId: z.string().uuid().optional().nullable(),
    unit: z.string().min(1),
    barcode: z.string().optional().nullable(),
    sellingPrice: z.string().optional().nullable(),
    isActive: z.boolean().default(true),
})

export async function GET() {
    try {
        const data = await db.query.medicines.findMany({
            orderBy: desc(medicines.name),
            with: {
                category: true
            }
        })
        return NextResponse.json({ data })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const validated = medicineSchema.parse(body)
        const [newMedicine] = await db.insert(medicines).values(validated).returning()
        return NextResponse.json({ data: newMedicine })
    } catch (error: any) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 })
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
