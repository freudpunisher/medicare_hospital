import { NextResponse } from "next/server"
import { db } from "@/db"
import { wards } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [ward] = await db.select().from(wards).where(eq(wards.id, id))
    if (!ward) return NextResponse.json({ error: "Not found" }, { status: 404 })
    return NextResponse.json({ data: ward })
  } catch (error: any) {
    console.error("Failed to fetch ward:", error)
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
    const { name, floor, isActive } = body

    const updateData: Record<string, any> = {}
    if (name !== undefined) updateData.name = name
    if (floor !== undefined) updateData.floor = floor
    if (isActive !== undefined) updateData.isActive = isActive

    const [updated] = await db.update(wards)
      .set(updateData)
      .where(eq(wards.id, id))
      .returning()

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    console.error("Failed to update ward:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const [deleted] = await db.delete(wards).where(eq(wards.id, id)).returning()
    return NextResponse.json({ data: deleted })
  } catch (error: any) {
    console.error("Failed to delete ward:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
