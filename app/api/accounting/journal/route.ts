import { NextResponse } from "next/server"
import { db } from "@/db"
import { journalEntries } from "@/db/schema"
import { postJournalEntry } from "@/lib/accounting"
import { z } from "zod"
import { desc, eq, and, gte, lte, ilike, or } from "drizzle-orm"

const manualEntrySchema = z.object({
  entryDate: z.string().min(1, "La date est obligatoire"),
  label: z.string().min(1, "Le libellé est obligatoire").max(255),
  createdBy: z.string().uuid().nullable().optional(),
  lines: z.array(z.object({
    accountCode: z.string().min(1),
    libelle: z.string().max(255).optional(),
    debit: z.number().nonnegative().optional(),
    credit: z.number().nonnegative().optional(),
  })).min(2, "Une écriture doit contenir au moins deux lignes"),
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const referenceType = searchParams.get("referenceType")
    const q = searchParams.get("q")

    const conditions = []
    if (from) conditions.push(gte(journalEntries.entryDate, new Date(from)))
    if (to) {
      const end = new Date(to)
      end.setHours(23, 59, 59, 999)
      conditions.push(lte(journalEntries.entryDate, end))
    }
    if (referenceType && referenceType !== "all") conditions.push(eq(journalEntries.referenceType, referenceType))
    if (q) conditions.push(or(ilike(journalEntries.entryNumber, `%${q}%`), ilike(journalEntries.label, `%${q}%`)))

    const data = await db.query.journalEntries.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(journalEntries.entryDate), desc(journalEntries.entryNumber)],
      with: {
        lines: {
          with: {
            account: true,
          },
        },
        creator: true,
      },
    })

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("Failed to fetch journal:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = manualEntrySchema.parse(body)

    const entry = await db.transaction(async (tx) => {
      return postJournalEntry(tx, {
        entryDate: new Date(validated.entryDate),
        label: validated.label,
        createdBy: validated.createdBy || null,
        lines: validated.lines.map((l) => ({
          accountCode: l.accountCode,
          libelle: l.libelle,
          debit: l.debit,
          credit: l.credit,
        })),
      })
    })

    return NextResponse.json({ data: entry }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors.map((e) => e.message).join(". ") }, { status: 400 })
    }
    console.error("Failed to create journal entry:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
