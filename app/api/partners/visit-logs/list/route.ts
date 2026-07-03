import { NextResponse } from 'next/server'
import { db } from '@/db'
import { partnershipVisitLogs, corporatePartners, corporateEmployees, patients, visits, invoices } from '@/db/schema'
import { eq, and, desc, count } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const partnerId = searchParams.get('partnerId')
    const offset = (page - 1) * limit

    const filters = []
    if (partnerId) {
      filters.push(eq(partnershipVisitLogs.partnerId, partnerId))
    }

    const whereCondition = filters.length > 0 ? and(...filters) : undefined

    const countQuery = whereCondition
      ? db.select({ count: count() }).from(partnershipVisitLogs).where(whereCondition)
      : db.select({ count: count() }).from(partnershipVisitLogs)

    const countResult = await countQuery
    const total = countResult[0]?.count || 0

    const data = await db
      .select({
        id: partnershipVisitLogs.id,
        partnerId: partnershipVisitLogs.partnerId,
        employeeId: partnershipVisitLogs.employeeId,
        visitId: partnershipVisitLogs.visitId,
        invoiceId: partnershipVisitLogs.invoiceId,
        totalDiscountApplied: partnershipVisitLogs.totalDiscountApplied,
        originalTotal: partnershipVisitLogs.originalTotal,
        finalTotal: partnershipVisitLogs.finalTotal,
        createdAt: partnershipVisitLogs.createdAt,
        partnerName: corporatePartners.companyName,
        employeeName: patients.firstName,
      })
      .from(partnershipVisitLogs)
      .leftJoin(corporatePartners, eq(partnershipVisitLogs.partnerId, corporatePartners.id))
      .leftJoin(corporateEmployees, eq(partnershipVisitLogs.employeeId, corporateEmployees.id))
      .leftJoin(patients, eq(corporateEmployees.patientId, patients.id))
      .leftJoin(visits, eq(partnershipVisitLogs.visitId, visits.id))
      .leftJoin(invoices, eq(partnershipVisitLogs.invoiceId, invoices.id))
      .where(whereCondition)
      .orderBy(desc(partnershipVisitLogs.createdAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      success: true,
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch partnership visit logs:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch partnership visit logs' }, { status: 500 })
  }
}
