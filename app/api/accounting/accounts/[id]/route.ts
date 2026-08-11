import { NextResponse } from "next/server"
import { db } from "@/db"
import { chartAccounts, journalEntryLines } from "@/db/schema"
import { z } from "zod"
import { eq, count } from "drizzle-orm"

const updateSchema = z.object({
  code: z.string().min(1).max(20).optional(),
  label: z.string().min(1).max(255).optional(),
  isActive: z.boolean().optional(),
  parentId: z.string().uuid().nullable().optional(),
})

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const validated = updateSchema.parse(body)

    const account = await db.query.chartAccounts.findFirst({ where: eq(chartAccounts.id, id) })
    if (!account) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 })
    }

    if (validated.code && validated.code !== account.code) {
      const existing = await db.query.chartAccounts.findFirst({
        where: eq(chartAccounts.code, validated.code),
      })
      if (existing) {
        return NextResponse.json({ error: `Le compte ${validated.code} existe déjà` }, { status: 409 })
      }
    }

    const [updated] = await db.update(chartAccounts)
      .set({
        code: validated.code,
        label: validated.label,
        parentId: validated.parentId === undefined ? undefined : validated.parentId,
        isActive: validated.isActive,
        updatedAt: new Date(),
      })
      .where(eq(chartAccounts.id, id))
      .returning()

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors.map((e) => e.message).join(". ") }, { status: 400 })
    }
    console.error("Failed to update account:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const account = await db.query.chartAccounts.findFirst({ where: eq(chartAccounts.id, id) })
    if (!account) {
      return NextResponse.json({ error: "Compte introuvable" }, { status: 404 })
    }

    const [lines] = await db.select({ total: count() }).from(journalEntryLines)
      .where(eq(journalEntryLines.accountId, id))
    if (Number(lines?.total || 0) > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer: ce compte est utilisé par des écritures comptables. Désactivez-le plutôt." },
        { status: 409 }
      )
    }

    await db.delete(chartAccounts).where(eq(chartAccounts.id, id))
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Failed to delete account:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
