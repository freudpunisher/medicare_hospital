import { NextResponse } from "next/server"
import { db } from "@/db"
import { labTests, labTestParameters } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const test = await db.query.labTests.findFirst({
      where: eq(labTests.id, id),
      with: {
        parameters: {
          orderBy: (params: any) => params.sortOrder,
        },
      },
    })

    if (!test) {
      return NextResponse.json({ error: "Lab test not found" }, { status: 404 })
    }

    return NextResponse.json({ data: test })
  } catch (error: any) {
    console.error("Failed to fetch lab test:", error)
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
    const { code, name, description, testType, price, turnaroundTimeHours, instructions, isActive, serviceId } = body

    const updateData: Record<string, any> = {}
    if (code !== undefined) updateData.code = code
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (testType !== undefined) updateData.testType = testType
    if (price !== undefined) updateData.price = price.toString()
    if (turnaroundTimeHours !== undefined) updateData.turnaroundTimeHours = turnaroundTimeHours.toString()
    if (instructions !== undefined) updateData.instructions = instructions
    if (isActive !== undefined) updateData.isActive = isActive
    if (serviceId !== undefined) updateData.serviceId = serviceId
    updateData.updatedAt = new Date()

    const [updated] = await db.update(labTests)
      .set(updateData)
      .where(eq(labTests.id, id))
      .returning()

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    console.error("Failed to update lab test:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [deleted] = await db.delete(labTests)
      .where(eq(labTests.id, id))
      .returning()

    return NextResponse.json({ data: deleted })
  } catch (error: any) {
    console.error("Failed to delete lab test:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
