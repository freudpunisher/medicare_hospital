import { NextResponse } from 'next/server'
import { db } from '@/db'
import { patients, corporatePartners, corporateEmployees, partnershipAgreements, partnershipServiceRules } from '@/db/schema'
import { eq, and, lte, gte, or, isNull, inArray } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const patientId = searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json({ success: false, error: 'patientId is required' }, { status: 400 })
    }

    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, patientId),
    })

    if (!patient || !patient.isCorporateEmployee || !patient.corporatePartnerId) {
      return NextResponse.json({ success: true, data: null })
    }

    const partner = await db.query.corporatePartners.findFirst({
      where: eq(corporatePartners.id, patient.corporatePartnerId),
    })

    if (!partner) {
      return NextResponse.json({ success: true, data: null })
    }

    const employee = await db.query.corporateEmployees.findFirst({
      where: eq(corporateEmployees.id, patient.corporateEmployeeId!),
    })

    const now = new Date()

    const agreements = await db
      .select()
      .from(partnershipAgreements)
      .where(
        and(
          eq(partnershipAgreements.partnerId, patient.corporatePartnerId),
          eq(partnershipAgreements.isActive, true),
          lte(partnershipAgreements.effectiveDate, now),
          or(isNull(partnershipAgreements.expiryDate), gte(partnershipAgreements.expiryDate, now)),
        ),
      )

    if (agreements.length === 0) {
      return NextResponse.json({
        success: true,
        data: { partner, employee, agreements: [], rules: [] },
      })
    }

    const agreementIds = agreements.map(a => a.id)

    const rules = agreementIds.length > 0
      ? await db
          .select()
          .from(partnershipServiceRules)
          .where(
            and(
              eq(partnershipServiceRules.partnerId, patient.corporatePartnerId),
              eq(partnershipServiceRules.isActive, true),
              inArray(partnershipServiceRules.agreementId, agreementIds),
            ),
          )
          .orderBy(partnershipServiceRules.priority)
      : []

    return NextResponse.json({
      success: true,
      data: { partner, employee, agreements, rules },
    })
  } catch (error) {
    console.error('Failed to fetch patient discounts:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch patient discounts' }, { status: 500 })
  }
}
