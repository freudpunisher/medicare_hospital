import { NextResponse } from "next/server"
import { db } from "@/db"
import { cashRegister } from "@/db/schema"
import { z } from "zod"
import { desc } from "drizzle-orm"

const registerSchema = z.object({
    name: z.string().min(1, "Le nom est obligatoire"),
    description: z.string().optional(),
    assignedToUserId: z.string().uuid().optional().nullable(),
})

export async function GET() {
    try {
        const data = await db.query.cashRegister.findMany({
            orderBy: desc(cashRegister.createdAt),
            with: {
                // Add relations if needed, but for now just list
            }
        })

        return NextResponse.json({ data })
    } catch (error: any) {
        console.error("Failed to fetch registers:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const validatedData = registerSchema.parse(body)

        const [newRegister] = await db.insert(cashRegister).values({
            name: validatedData.name,
            description: validatedData.description,
            assignedToUserId: validatedData.assignedToUserId,
        }).returning()

        return NextResponse.json({ data: newRegister })
    } catch (error: any) {
        console.error("Failed to create register:", error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors.map((e) => e.message).join(". ") }, { status: 400 })
        }
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
