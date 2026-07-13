import { NextResponse } from "next/server"
import { db } from "@/db"
import { labTests, labTestParameters, services } from "@/db/schema"
import { eq, desc, ilike, and, sql } from "drizzle-orm"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const type = searchParams.get("type")
    const active = searchParams.get("active")

    const conditions = []
    if (search) conditions.push(ilike(labTests.name, `%${search}%`))
    if (type) conditions.push(eq(labTests.testType, type))
    if (active === "true") conditions.push(eq(labTests.isActive, true))

    const data = await db.select({
      id: labTests.id,
      code: labTests.code,
      name: labTests.name,
      testType: labTests.testType,
      price: labTests.price,
      turnaroundTimeHours: labTests.turnaroundTimeHours,
      isActive: labTests.isActive,
      description: labTests.description,
      instructions: labTests.instructions,
      createdAt: labTests.createdAt,
      serviceId: labTests.serviceId,
      serviceName: services.name,
      parameterCount: sql<number>`(select count(*) from ${labTestParameters} where ${labTestParameters.labTestId} = ${labTests.id})`,
    })
      .from(labTests)
      .leftJoin(services, eq(labTests.serviceId, services.id))
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
    const { code, name, description, testType, price, turnaroundTimeHours, instructions, serviceId } = body

    if (!code || !name || !testType || !serviceId) {
      return NextResponse.json({ error: "Code, name, test type, and service are required" }, { status: 400 })
    }

    const [test] = await db.insert(labTests).values({
      code,
      name,
      description,
      testType,
      price: (price || "0").toString(),
      turnaroundTimeHours: (turnaroundTimeHours || "24").toString(),
      instructions,
      serviceId,
    }).returning()

    return NextResponse.json({ data: test }, { status: 201 })
  } catch (error: any) {
    console.error("Failed to create lab test:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
