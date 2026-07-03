import { NextResponse } from 'next/server'
import { db } from '@/db'
import { partnershipServiceRules, corporatePartners, partnershipAgreements, services, medicalActs, specialties } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const agreementId = searchParams.get('agreementId')
    const partnerId = searchParams.get('partnerId')

    const filters = []
    if (agreementId) {
      filters.push(eq(partnershipServiceRules.agreementId, agreementId))
    }
    if (partnerId) {
      filters.push(eq(partnershipServiceRules.partnerId, partnerId))
    }

    const whereCondition = filters.length > 0 ? and(...filters) : undefined

    const data = await db
      .select({
        id: partnershipServiceRules.id,
        partnerId: partnershipServiceRules.partnerId,
        agreementId: partnershipServiceRules.agreementId,
        serviceId: partnershipServiceRules.serviceId,
        medicalActId: partnershipServiceRules.medicalActId,
        specialtyId: partnershipServiceRules.specialtyId,
        reductionType: partnershipServiceRules.reductionType,
        reductionValue: partnershipServiceRules.reductionValue,
        maxReductionAmount: partnershipServiceRules.maxReductionAmount,
        minBillableAmount: partnershipServiceRules.minBillableAmount,
        isActive: partnershipServiceRules.isActive,
        priority: partnershipServiceRules.priority,
        notes: partnershipServiceRules.notes,
        createdAt: partnershipServiceRules.createdAt,
        updatedAt: partnershipServiceRules.updatedAt,
        partnerName: corporatePartners.companyName,
        agreementNumber: partnershipAgreements.agreementNumber,
        serviceName: services.name,
        medicalActName: medicalActs.name,
        specialtyName: specialties.name,
      })
      .from(partnershipServiceRules)
      .leftJoin(corporatePartners, eq(partnershipServiceRules.partnerId, corporatePartners.id))
      .leftJoin(partnershipAgreements, eq(partnershipServiceRules.agreementId, partnershipAgreements.id))
      .leftJoin(services, eq(partnershipServiceRules.serviceId, services.id))
      .leftJoin(medicalActs, eq(partnershipServiceRules.medicalActId, medicalActs.id))
      .leftJoin(specialties, eq(partnershipServiceRules.specialtyId, specialties.id))
      .where(whereCondition)

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Failed to fetch partnership service rules:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch partnership service rules' }, { status: 500 })
  }
}
