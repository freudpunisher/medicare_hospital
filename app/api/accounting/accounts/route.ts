import { NextResponse } from "next/server"
import { db } from "@/db"
import { chartAccounts } from "@/db/schema"
import { z } from "zod"
import { asc, eq, and } from "drizzle-orm"

const CLASS_TO_TYPE: Record<string, string> = {
  "1": "equity",
  "2": "asset",
  "3": "asset",
  "4": "liability",
  "5": "asset",
  "6": "expense",
  "7": "revenue",
}

const accountSchema = z.object({
  code: z.string().min(1, "Le code est obligatoire").max(20),
  label: z.string().min(1, "Le libellé est obligatoire").max(255),
  class: z.string().min(1).max(1).regex(/^[1-7]$/, "La classe doit être entre 1 et 7"),
  parentId: z.string().uuid().nullable().optional(),
})

export async function GET() {
  try {
    const data = await db.query.chartAccounts.findMany({
      orderBy: [asc(chartAccounts.class), asc(chartAccounts.code)],
      with: {
        children: true,
      },
    })

    return NextResponse.json({ data })
  } catch (error: any) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const validated = accountSchema.parse(body)

    const existing = await db.query.chartAccounts.findFirst({
      where: eq(chartAccounts.code, validated.code),
    })
    if (existing) {
      return NextResponse.json({ error: `Le compte ${validated.code} existe déjà` }, { status: 409 })
    }

    if (validated.parentId) {
      const parent = await db.query.chartAccounts.findFirst({
        where: and(eq(chartAccounts.id, validated.parentId), eq(chartAccounts.isActive, true)),
      })
      if (!parent) {
        return NextResponse.json({ error: "Compte parent introuvable ou inactif" }, { status: 400 })
      }
    }

    const [account] = await db.insert(chartAccounts).values({
      code: validated.code,
      label: validated.label,
      class: validated.class,
      type: CLASS_TO_TYPE[validated.class],
      parentId: validated.parentId || null,
    }).returning()

    return NextResponse.json({ data: account }, { status: 201 })
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors.map((e) => e.message).join(". ") }, { status: 400 })
    }
    console.error("Failed to create account:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
