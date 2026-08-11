import { NextResponse } from "next/server"
import { db } from "@/db"
import { labTests, medicalActs } from "@/db/schema"
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
        medicalAct: true,
        parameters: {
          orderBy: (p: any) => p.sortOrder,
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
    const { description, testType, turnaroundTimeHours, instructions, isActive } = body

    const updateData: Record<string, any> = {}
    if (description !== undefined) updateData.description = description
    if (testType !== undefined) updateData.testType = testType
    if (turnaroundTimeHours !== undefined) updateData.turnaroundTimeHours = turnaroundTimeHours.toString()
    if (instructions !== undefined) updateData.instructions = instructions
    if (isActive !== undefined) updateData.isActive = isActive
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
