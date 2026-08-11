import { NextResponse } from "next/server"
import { db } from "@/db"
import { beds } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const { wardId, bedNumber, bedType, status, isActive } = body

    const updateData: Record<string, any> = {}
    if (wardId !== undefined) updateData.wardId = wardId
    if (bedNumber !== undefined) updateData.bedNumber = bedNumber
    if (bedType !== undefined) updateData.bedType = bedType
    if (status !== undefined) updateData.status = status
    if (isActive !== undefined) updateData.isActive = isActive

    const [updated] = await db.update(beds)
      .set(updateData)
      .where(eq(beds.id, id))
      .returning()

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    console.error("Failed to update bed:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [deleted] = await db.delete(beds).where(eq(beds.id, id)).returning()
    return NextResponse.json({ data: deleted })
  } catch (error: any) {
    console.error("Failed to delete bed:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
