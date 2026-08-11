import { NextResponse } from "next/server"
import { db } from "@/db"
import { labTests, labTestParameters, medicalActs, services } from "@/db/schema"
import { eq, desc, ilike, and, sql } from "drizzle-orm"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const type = searchParams.get("type")
    const active = searchParams.get("active")

    const conditions = []
    if (search) conditions.push(ilike(medicalActs.name, `%${search}%`))
    if (type) conditions.push(eq(labTests.testType, type as any))
    if (active === "true") conditions.push(eq(labTests.isActive, true))

    const data = await db.select({
      id: labTests.id,
      description: labTests.description,
      testType: labTests.testType,
      turnaroundTimeHours: labTests.turnaroundTimeHours,
      instructions: labTests.instructions,
      isActive: labTests.isActive,
      createdAt: labTests.createdAt,
      medicalActId: labTests.medicalActId,
      code: medicalActs.code,
      name: medicalActs.name,
      price: medicalActs.basePrice,
      serviceName: services.name,
      parameterCount: sql<number>`(select count(*) from ${labTestParameters} where ${labTestParameters.labTestId} = ${labTests.id})`,
    })
      .from(labTests)
      .innerJoin(medicalActs, sql`${labTests.medicalActId} = ${medicalActs.id}`)
      .leftJoin(services, eq(medicalActs.serviceId, services.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(labTests.createdAt))

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("Failed to fetch lab tests:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { medicalActId, description, testType, turnaroundTimeHours, instructions } = body

    if (!medicalActId || !testType || !instructions) {
      return NextResponse.json({ error: "Medical act, test type, and instructions are required" }, { status: 400 })
    }

    const [test] = await db.insert(labTests).values({
      medicalActId,
      description,
      testType,
      turnaroundTimeHours: (turnaroundTimeHours || "24").toString(),
      instructions,
    }).returning()

    return NextResponse.json({ data: test }, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create lab test:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
