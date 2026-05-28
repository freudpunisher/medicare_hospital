import { NextResponse } from "next/server"
import { db } from "@/db"
import { suppliers } from "@/db/schema"
import { eq } from "drizzle-orm"
import { z } from "zod"

const supplierSchema = z.object({
    name: z.string().min(1),
    contactName: z.string().optional().nullable(),
    phone: z.string().optional().nullable(),
    email: z.string().email().optional().nullable(),
    address: z.string().optional().nullable(),
})

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const validated = supplierSchema.parse(body)
        const [updated] = await db
            .update(suppliers)
            .set(validated)
            .where(eq(suppliers.id, id))
            .returning()

        if (!updated) return NextResponse.json({ error: "Supplier not found" }, { status: 404 })
        return NextResponse.json({ data: updated })
    } catch (error: any) {
        if (error instanceof z.ZodError) return NextResponse.json({ error: error.errors }, { status: 400 })
        return NextResponse.json({ error: error.message }, { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await db.delete(suppliers).where(eq(suppliers.id, id))
        return NextResponse.json({ success: true })
    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
