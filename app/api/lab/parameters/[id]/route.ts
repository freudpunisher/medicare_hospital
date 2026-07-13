import { NextResponse } from "next/server"
import { db } from "@/db"
import { labTestParameters } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { parameterCode, parameterName, unit, referenceRangeLow, referenceRangeHigh, referenceRangeText, maleRefRangeLow, maleRefRangeHigh, femaleRefRangeLow, femaleRefRangeHigh, sortOrder, isActive } = body

    const updateData: Record<string, any> = {}
    if (parameterCode !== undefined) updateData.parameterCode = parameterCode
    if (parameterName !== undefined) updateData.parameterName = parameterName
    if (unit !== undefined) updateData.unit = unit
    if (referenceRangeLow !== undefined) updateData.referenceRangeLow = referenceRangeLow?.toString() || null
    if (referenceRangeHigh !== undefined) updateData.referenceRangeHigh = referenceRangeHigh?.toString() || null
    if (referenceRangeText !== undefined) updateData.referenceRangeText = referenceRangeText
    if (maleRefRangeLow !== undefined) updateData.maleRefRangeLow = maleRefRangeLow?.toString() || null
    if (maleRefRangeHigh !== undefined) updateData.maleRefRangeHigh = maleRefRangeHigh?.toString() || null
    if (femaleRefRangeLow !== undefined) updateData.femaleRefRangeLow = femaleRefRangeLow?.toString() || null
    if (femaleRefRangeHigh !== undefined) updateData.femaleRefRangeHigh = femaleRefRangeHigh?.toString() || null
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder.toString()
    if (isActive !== undefined) updateData.isActive = isActive

    const [updated] = await db.update(labTestParameters)
      .set(updateData)
      .where(eq(labTestParameters.id, id))
      .returning()

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    console.error("Failed to update parameter:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [deleted] = await db.delete(labTestParameters)
      .where(eq(labTestParameters.id, id))
      .returning()

    return NextResponse.json({ data: deleted })
  } catch (error: any) {
    console.error("Failed to delete parameter:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
