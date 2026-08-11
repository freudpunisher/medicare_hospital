import { NextResponse } from "next/server"
import { db } from "@/db"
import { hospitalizations, patients, wards, beds, bedAssignments } from "@/db/schema"
import { eq, desc, and, ilike, sql } from "drizzle-orm"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const search = searchParams.get("search")

    const conditions = []
    if (status && status !== "all") conditions.push(eq(hospitalizations.status, status))
    if (search) {
      const like = `%${search}%`
      conditions.push(sql`exists (select 1 from ${patients} where ${patients.id} = ${hospitalizations.patientId} and (${patients.firstName} ilike ${like} or ${patients.lastName} ilike ${like}))`)
    }

    const data = await db.select({
      id: hospitalizations.id,
      patientId: hospitalizations.patientId,
      patientName: sql<string>`${patients.firstName} || ' ' || ${patients.lastName}`,
      status: hospitalizations.status,
      admissionDate: hospitalizations.admissionDate,
      reason: hospitalizations.reason,
      wardName: wards.name,
      bedNumber: beds.bedNumber,
    })
      .from(hospitalizations)
      .innerJoin(patients, eq(hospitalizations.patientId, patients.id))
      .leftJoin(bedAssignments, and(
        eq(bedAssignments.hospitalizationId, hospitalizations.id),
        sql`${bedAssignments.releasedAt} IS NULL`
      ))
      .leftJoin(beds, eq(bedAssignments.bedId, beds.id))
      .leftJoin(wards, eq(beds.wardId, wards.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(hospitalizations.admissionDate))

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("Failed to fetch admissions:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { patientId, bedId, reason, doctorId } = body

    if (!patientId || !bedId || !reason?.trim()) {
      return NextResponse.json({ error: "Patient, bed, and reason are required" }, { status: 400 })
    }

    // Check bed availability
    const [bed] = await db.select().from(beds).where(eq(beds.id, bedId))
    if (!bed || bed.status !== "available") {
      return NextResponse.json({ error: "Bed is not available" }, { status: 400 })
    }

    // Create hospitalization and assign bed in a transaction
    const result = await db.transaction(async (tx) => {
      const [hosp] = await tx.insert(hospitalizations).values({
        patientId,
        reason: reason.trim(),
        doctorId: doctorId || null,
        status: "admitted",
      }).returning()

      await tx.insert(bedAssignments).values({
        hospitalizationId: hosp.id,
        bedId,
        assignmentType: "admission",
      })

      await tx.update(beds)
        .set({ status: "occupied" })
        .where(eq(beds.id, bedId))

      return hosp
    })

    return NextResponse.json({ data: result }, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create admission:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
