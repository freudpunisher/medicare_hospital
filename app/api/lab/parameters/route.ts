import { NextResponse } from "next/server"
import { db } from "@/db"
import { labTestParameters, labTests, medicalActs } from "@/db/schema"
import { eq, desc, ilike, and, sql } from "drizzle-orm"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get("search")
    const testId = searchParams.get("testId")

    const conditions = []
    if (search) {
      conditions.push(
        ilike(labTestParameters.parameterName, `%${search}%`)
      )
    }
    if (testId) conditions.push(eq(labTestParameters.labTestId, testId))

    const data = await db.select({
      id: labTestParameters.id,
      parameterCode: labTestParameters.parameterCode,
      parameterName: labTestParameters.parameterName,
      unit: labTestParameters.unit,
      referenceRangeLow: labTestParameters.referenceRangeLow,
      referenceRangeHigh: labTestParameters.referenceRangeHigh,
      referenceRangeText: labTestParameters.referenceRangeText,
      maleRefRangeLow: labTestParameters.maleRefRangeLow,
      maleRefRangeHigh: labTestParameters.maleRefRangeHigh,
      femaleRefRangeLow: labTestParameters.femaleRefRangeLow,
      femaleRefRangeHigh: labTestParameters.femaleRefRangeHigh,
      sortOrder: labTestParameters.sortOrder,
      isActive: labTestParameters.isActive,
      labTestId: labTestParameters.labTestId,
      testName: medicalActs.name,
      testCode: medicalActs.code,
    })
      .from(labTestParameters)
      .leftJoin(labTests, eq(labTestParameters.labTestId, labTests.id))
      .leftJoin(medicalActs, sql`${labTests.medicalActId} = ${medicalActs.id}`)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(labTestParameters.sortOrder))

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error("Failed to fetch parameters:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
