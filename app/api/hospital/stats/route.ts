import { NextResponse } from "next/server"
import { db } from "@/db"
import { hospitalizations, beds } from "@/db/schema"
import { eq, sql, and } from "drizzle-orm"

export async function GET() {
  try {
    const [admitted] = await db
      .select({ count: sql<number>`count(*)` })
      .from(hospitalizations)
      .where(eq(hospitalizations.status, "admitted"))

    const [todayAdmissions] = await db
      .select({ count: sql<number>`count(*)` })
      .from(hospitalizations)
      .where(and(
        eq(hospitalizations.status, "admitted"),
        sql`${hospitalizations.admissionDate}::date = CURRENT_DATE`
      ))

    const [occupiedBeds] = await db
      .select({ count: sql<number>`count(*)` })
      .from(beds)
      .where(eq(beds.status, "occupied"))

    const [availableBeds] = await db
      .select({ count: sql<number>`count(*)` })
      .from(beds)
      .where(eq(beds.status, "available"))

    return NextResponse.json({
      data: {
        admitted: Number(admitted?.count || 0),
        todayAdmissions: Number(todayAdmissions?.count || 0),
        occupiedBeds: Number(occupiedBeds?.count || 0),
        availableBeds: Number(availableBeds?.count || 0),
      }
    })
  } catch (error: any) {
    console.error("Failed to fetch hospital stats:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
