import { NextResponse } from "next/server"
import { db } from "@/db"
import { labTestParameters } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const parameters = await db.query.labTestParameters.findMany({
      where: eq(labTestParameters.labTestId, id),
      orderBy: (params: any) => params.sortOrder,
    })

    return NextResponse.json({ data: parameters })
  } catch (error: any) {
    console.error("Failed to fetch parameters:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { parameterCode, parameterName, unit, referenceRangeLow, referenceRangeHigh, referenceRangeText, maleRefRangeLow, maleRefRangeHigh, femaleRefRangeLow, femaleRefRangeHigh, sortOrder, isActive } = body

    if (!parameterCode || !parameterName || !unit) {
      return NextResponse.json({ error: "Parameter code, name, and unit are required" }, { status: 400 })
    }

    const [param] = await db.insert(labTestParameters).values({
      labTestId: id,
      parameterCode,
      parameterName,
      unit,
      referenceRangeLow: referenceRangeLow?.toString() || null,
      referenceRangeHigh: referenceRangeHigh?.toString() || null,
      referenceRangeText,
      maleRefRangeLow: maleRefRangeLow?.toString() || null,
      maleRefRangeHigh: maleRefRangeHigh?.toString() || null,
      femaleRefRangeLow: femaleRefRangeLow?.toString() || null,
      femaleRefRangeHigh: femaleRefRangeHigh?.toString() || null,
      sortOrder: (sortOrder || "0").toString(),
      isActive: isActive !== undefined ? isActive : true,
    }).returning()

    return NextResponse.json({ data: param }, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create parameter:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
