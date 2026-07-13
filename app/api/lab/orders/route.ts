import { NextResponse } from "next/server"
import { db } from "@/db"
import { labOrders, labTests, patients, users } from "@/db/schema"
import { eq, desc, and, ilike, sql } from "drizzle-orm"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get("status")
    const patientSearch = searchParams.get("patient")
    const labTestId = searchParams.get("testId")

    const conditions = []
    if (status && status !== "all") conditions.push(eq(labOrders.status, status))
    if (labTestId) conditions.push(eq(labOrders.labTestId, labTestId))
    if (patientSearch) {
      const like = `%${patientSearch}%`
      conditions.push(sql`exists (select 1 from ${patients} where ${patients.id} = ${labOrders.patientId} and (${patients.firstName} ilike ${like} or ${patients.lastName} ilike ${like}))`)
    }

    const data = await db.select({
      id: labOrders.id,
      orderNumber: labOrders.orderNumber,
      status: labOrders.status,
      priority: labOrders.priority,
      createdAt: labOrders.createdAt,
      sampledAt: labOrders.sampledAt,
      notes: labOrders.notes,
      clinicalNotes: labOrders.clinicalNotes,
      patient: { id: patients.id, firstName: patients.firstName, lastName: patients.lastName },
      labTest: { id: labTests.id, code: labTests.code, name: labTests.name, testType: labTests.testType },
      orderedBy: { id: users.id, fullName: users.fullName },
    })
      .from(labOrders)
      .innerJoin(patients, eq(labOrders.patientId, patients.id))
      .innerJoin(labTests, eq(labOrders.labTestId, labTests.id))
      .leftJoin(users, eq(labOrders.orderedBy, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(labOrders.createdAt))

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("Failed to fetch lab orders:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { labTestId, patientId, visitId, orderedBy, priority, clinicalNotes } = body

    if (!labTestId || !patientId || !orderedBy) {
      return NextResponse.json({ error: "Lab test, patient, and orderer are required" }, { status: 400 })
    }

    const date = new Date()
    const dateStr = date.toISOString().split("T")[0].replace(/-/g, "")
    const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
    const orderNumber = `LAB-${dateStr}-${randomStr}`

    const [order] = await db.insert(labOrders).values({
      orderNumber,
      labTestId,
      patientId,
      visitId: visitId || null,
      orderedBy,
      priority: priority || "normal",
      clinicalNotes: clinicalNotes || null,
    }).returning()

    return NextResponse.json({ data: order }, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create lab order:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
