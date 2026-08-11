import { NextResponse } from "next/server"
import { db } from "@/db"
import { beds, wards } from "@/db/schema"
import { eq, desc, and, sql } from "drizzle-orm"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const wardId = searchParams.get("wardId")
    const status = searchParams.get("status")

    const conditions = []
    if (wardId) conditions.push(eq(beds.wardId, wardId))
    if (status) conditions.push(eq(beds.status, status as any))

    const data = await db.select({
      id: beds.id,
      bedNumber: beds.bedNumber,
      bedType: beds.bedType,
      status: beds.status,
      isActive: beds.isActive,
      wardId: beds.wardId,
      wardName: wards.name,
    })
      .from(beds)
      .leftJoin(wards, eq(beds.wardId, wards.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(beds.createdAt))

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("Failed to fetch beds:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { wardId, bedNumber, bedType } = body

    if (!wardId || !bedNumber?.trim()) {
      return NextResponse.json({ error: "Ward and bed number are required" }, { status: 400 })
    }

    const [bed] = await db.insert(beds).values({
      wardId,
      bedNumber: bedNumber.trim(),
      bedType: bedType || "standard",
    }).returning()

    return NextResponse.json({ data: bed }, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create bed:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
