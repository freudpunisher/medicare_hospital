import { NextResponse } from 'next/server'
import { db } from '@/db'
import { corporateEmployees, corporatePartners, patients } from '@/db/schema'
import { eq, and, sql } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const partnerId = searchParams.get('partnerId')

    const filters = []
    if (partnerId) {
      filters.push(eq(corporateEmployees.partnerId, partnerId))
    }

    const whereCondition = filters.length > 0 ? and(...filters) : undefined

    const data = await db
      .select({
        id: corporateEmployees.id,
        partnerId: corporateEmployees.partnerId,
        patientId: corporateEmployees.patientId,
        employeeNumber: corporateEmployees.employeeNumber,
        department: corporateEmployees.department,
        position: corporateEmployees.position,
        hireDate: corporateEmployees.hireDate,
        isActive: corporateEmployees.isActive,
        createdAt: corporateEmployees.createdAt,
        updatedAt: corporateEmployees.updatedAt,
        partnerName: corporatePartners.companyName,
        patientName: sql`concat(${patients.firstName}, ' ', ${patients.lastName})`,
      })
      .from(corporateEmployees)
      .leftJoin(corporatePartners, eq(corporateEmployees.partnerId, corporatePartners.id))
      .leftJoin(patients, eq(corporateEmployees.patientId, patients.id))
      .where(whereCondition)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Failed to fetch corporate employees:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch corporate employees' }, { status: 500 })
  }
}
