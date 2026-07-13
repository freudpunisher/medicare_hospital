import { NextResponse } from "next/server"
import { db } from "@/db"
import { labOrders, labResults, labResultValues, labTestParameters } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: orderId } = await params
    const body = await req.json()
    const { recordedBy, notes, values } = body

    if (!recordedBy || !values || values.length === 0) {
      return NextResponse.json({ error: "Recorded by and values are required" }, { status: 400 })
    }

    // Check order exists
    const order = await db.query.labOrders.findFirst({ where: eq(labOrders.id, orderId) })
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 })

    // Use a transaction
    const result = await db.transaction(async (tx) => {
      // Upsert: delete existing result if any, then create new
      const existing = await tx.query.labResults.findFirst({ where: eq(labResults.labOrderId, orderId) })
      if (existing) {
        await tx.delete(labResultValues).where(eq(labResultValues.labResultId, existing.id))
        await tx.delete(labResults).where(eq(labResults.id, existing.id))
      }

      const [resultHeader] = await tx.insert(labResults).values({
        labOrderId: orderId,
        recordedBy,
        notes: notes || null,
      }).returning()

      const resultValues = []
      for (const v of values) {
        const param = await tx.query.labTestParameters.findFirst({
          where: eq(labTestParameters.id, v.labTestParameterId),
        })
        if (!param) continue

        const numericValue = v.value && !isNaN(Number(v.value)) ? v.value : null

        let interpretation: string | null = null
        if (numericValue !== null) {
          const num = parseFloat(numericValue)
          if (param.referenceRangeLow && num < parseFloat(param.referenceRangeLow)) {
            if (param.maleRefRangeLow || param.femaleRefRangeLow) {
              // gender-specific ranges — skip auto-interpretation
            } else {
              interpretation = num < parseFloat(param.referenceRangeLow) * 0.5 ? "critical_low" : "low"
            }
          } else if (param.referenceRangeHigh && num > parseFloat(param.referenceRangeHigh)) {
            if (param.maleRefRangeLow || param.femaleRefRangeLow) {
            } else {
              interpretation = num > parseFloat(param.referenceRangeHigh) * 1.5 ? "critical_high" : "high"
            }
          } else {
            interpretation = "normal"
          }
        }

        const [rv] = await tx.insert(labResultValues).values({
          labResultId: resultHeader.id,
          labTestParameterId: v.labTestParameterId,
          value: v.value || "",
          numericValue: numericValue,
          unit: v.unit || param.unit,
          interpretation: interpretation as any,
          flagged: interpretation && interpretation !== "normal",
          referenceRangeUsed: param.referenceRangeText || (
            param.referenceRangeLow || param.referenceRangeHigh
              ? `${param.referenceRangeLow || "—"} — ${param.referenceRangeHigh || "—"}`
              : null
          ),
          comment: v.comment || null,
        }).returning()

        resultValues.push(rv)
      }

      // Update order status to results_entered
      await tx.update(labOrders)
        .set({ status: "results_entered", updatedAt: new Date() })
        .where(eq(labOrders.id, orderId))

      return { header: resultHeader, values: resultValues }
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error: any) {
    console.error("Failed to submit lab results:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
