import { NextResponse } from "next/server"
import { db } from "@/db"
import { accountingMappings, chartAccounts } from "@/db/schema"
import { z } from "zod"
import { asc, eq } from "drizzle-orm"

const mappingSchema = z.object({
  debitCode: z.string().min(1).max(20),
  creditCode: z.string().min(1).max(20),
  isActive: z.boolean().optional(),
})

export async function GET() {
  try {
    const data = await db.query.accountingMappings.findMany({
      orderBy: asc(accountingMappings.eventType),
    })

    const accounts = await db.query.chartAccounts.findMany({
      orderBy: asc(chartAccounts.code),
    })

    const enriched = data.map((m) => ({
      ...m,
      debitAccount: accounts.find((a) => a.code === m.debitCode) || null,
      creditAccount: accounts.find((a) => a.code === m.creditCode) || null,
    }))

    return NextResponse.json({ data: enriched, accounts })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json()
    const { id, ...rest } = body
    const validated = mappingSchema.parse(rest)

    if (!id) {
      return NextResponse.json({ error: "ID requis" }, { status: 400 })
    }

    const mapping = await db.query.accountingMappings.findFirst({
      where: eq(accountingMappings.id, id),
    })
    if (!mapping) {
      return NextResponse.json({ error: "Règle introuvable" }, { status: 404 })
    }

    for (const code of [validated.debitCode, validated.creditCode]) {
      const account = await db.query.chartAccounts.findFirst({
        where: eq(chartAccounts.code, code),
      })
      if (!account) {
        return NextResponse.json({ error: `Compte ${code} introuvable` }, { status: 400 })
      }
    }

    const [updated] = await db.update(accountingMappings)
      .set({
        debitCode: validated.debitCode,
        creditCode: validated.creditCode,
        isActive: validated.isActive,
        updatedAt: new Date(),
      })
      .where(eq(accountingMappings.id, id))
      .returning()

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors.map((e) => e.message).join(". ") }, { status: 400 })
    }
    console.error("Failed to update mapping:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
