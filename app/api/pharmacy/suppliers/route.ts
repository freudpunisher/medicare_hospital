import { NextResponse } from "next/server"
import { db } from "@/db"
import { suppliers } from "@/db/schema"
import { z } from "zod"

const supplierSchema = z.object({
    name: z.string().min(1),
    contactName: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
})

export async function GET() {
    try {
        const data = await db.query.suppliers.findMany({ orderBy: (s, { asc }) => [asc(s.name)] })
        return NextResponse.json({ data })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const validated = supplierSchema.parse(body)
        const [newSupplier] = await db.insert(suppliers).values(validated).returning()
        return NextResponse.json({ data: newSupplier })
    } catch (error: any) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors.map((e: any) => e.message).join('. ') }, { status: 400 })
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}
