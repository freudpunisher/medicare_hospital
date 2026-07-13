import { NextResponse } from "next/server"
import { db } from "@/db"
import { labOrders, labTests, labTestParameters, labResults, labResultValues, patients, users } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const order = await db.query.labOrders.findFirst({
      where: eq(labOrders.id, id),
      with: {
        patient: true,
        labTest: {
          with: {
            parameters: {
              orderBy: (p: any) => p.sortOrder,
            },
          },
        },
        orderer: true,
        sampler: true,
        result: {
          with: {
            recordedByUser: true,
            verifier: true,
            values: {
              with: {
                parameter: true,
              },
            },
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    return NextResponse.json({ data: order })
  } catch (error: any) {
    console.error("Failed to fetch lab order:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { status, sampledBy, sampledAt, priority, notes } = body

    const updateData: Record<string, any> = {}
    if (status) updateData.status = status
    if (priority) updateData.priority = priority
    if (notes !== undefined) updateData.notes = notes
    if (sampledBy) {
      updateData.sampledBy = sampledBy
      updateData.sampledAt = new Date()
    }
    if (sampledAt) updateData.sampledAt = sampledAt
    updateData.updatedAt = new Date()

    const [updated] = await db.update(labOrders)
      .set(updateData)
      .where(eq(labOrders.id, id))
      .returning()

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    console.error("Failed to update lab order:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
