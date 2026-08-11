import { NextResponse } from "next/server"
import { db } from "@/db"
import { wards, beds } from "@/db/schema"
import { eq, desc, ilike, and, sql } from "drizzle-orm"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const active = searchParams.get("active")

    const conditions = []
    if (active === "true") conditions.push(eq(wards.isActive, true))

    const data = await db.select({
      id: wards.id,
      name: wards.name,
      floor: wards.floor,
      isActive: wards.isActive,
      createdAt: wards.createdAt,
      bedCount: sql<number>`(select count(*) from ${beds} where ${beds.wardId} = ${wards.id})`,
    })
      .from(wards)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(wards.createdAt))

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("Failed to fetch wards:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, floor } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 })
    }

    const [ward] = await db.insert(wards).values({
      name: name.trim(),
      floor: floor || null,
    }).returning()

    return NextResponse.json({ data: ward }, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create ward:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
