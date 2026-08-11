import { NextResponse } from "next/server"
import { db } from "@/db"
import { hospitalizations, patients, beds, wards, bedAssignments, users } from "@/db/schema"
import { eq, and, sql } from "drizzle-orm"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [hosp] = await db.select({
      id: hospitalizations.id,
      patientId: hospitalizations.patientId,
      patientName: sql<string>`${patients.firstName} || ' ' || ${patients.lastName}`,
      status: hospitalizations.status,
      admissionDate: hospitalizations.admissionDate,
      dischargeDate: hospitalizations.dischargeDate,
      reason: hospitalizations.reason,
      dischargeSummary: hospitalizations.dischargeSummary,
      doctorName: users.fullName,
      bedId: beds.id,
      bedNumber: beds.bedNumber,
      wardId: wards.id,
      wardName: wards.name,
    })
      .from(hospitalizations)
      .innerJoin(patients, eq(hospitalizations.patientId, patients.id))
      .leftJoin(users, eq(hospitalizations.doctorId, users.id))
      .leftJoin(bedAssignments, and(
        eq(bedAssignments.hospitalizationId, hospitalizations.id),
        sql`${bedAssignments.releasedAt} IS NULL`
      ))
      .leftJoin(beds, eq(bedAssignments.bedId, beds.id))
      .leftJoin(wards, eq(beds.wardId, wards.id))
      .where(eq(hospitalizations.id, id))

    if (!hosp) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    return NextResponse.json({ data: hosp })
  } catch (error: any) {
    console.error("Failed to fetch admission:", error)
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
    const { status, dischargeSummary, dischargeDate, doctorId, reason } = body

    // If discharging, free the bed
    if (status === "discharged") {
      await db.transaction(async (tx) => {
        const [current] = await tx
          .select({ bedId: bedAssignments.bedId })
          .from(bedAssignments)
          .where(and(
            eq(bedAssignments.hospitalizationId, id),
            sql`${bedAssignments.releasedAt} IS NULL`
          ))

        if (current?.bedId) {
          await tx.update(bedAssignments)
            .set({ releasedAt: new Date() })
            .where(and(
              eq(bedAssignments.hospitalizationId, id),
              sql`${bedAssignments.releasedAt} IS NULL`
            ))

          await tx.update(beds)
            .set({ status: "available" })
            .where(eq(beds.id, current.bedId))
        }

        const updateData: Record<string, any> = { status: "discharged" }
        if (dischargeSummary) updateData.dischargeSummary = dischargeSummary
        updateData.dischargeDate = dischargeDate || new Date()

        await tx.update(hospitalizations)
          .set(updateData)
          .where(eq(hospitalizations.id, id))
      })

      const [updated] = await db.select().from(hospitalizations).where(eq(hospitalizations.id, id))
      return NextResponse.json({ data: updated })
    }

    // Normal update
    const updateData: Record<string, any> = {}
    if (status) updateData.status = status
    if (dischargeSummary) updateData.dischargeSummary = dischargeSummary
    if (doctorId) updateData.doctorId = doctorId
    if (reason) updateData.reason = reason
    if (dischargeDate) updateData.dischargeDate = dischargeDate
    updateData.updatedAt = new Date()

    const [updated] = await db.update(hospitalizations)
      .set(updateData)
      .where(eq(hospitalizations.id, id))
      .returning()

    return NextResponse.json({ data: updated })
  } catch (error: any) {
    console.error("Failed to update admission:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
