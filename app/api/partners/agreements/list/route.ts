import { NextResponse } from 'next/server'
import { db } from '@/db'
import { partnershipAgreements, corporatePartners } from '@/db/schema'
import { eq, and, desc } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const partnerId = searchParams.get('partnerId')

    const filters = []
    if (partnerId) {
      filters.push(eq(partnershipAgreements.partnerId, partnerId))
    }

    const whereCondition = filters.length > 0 ? and(...filters) : undefined

    const data = await db
      .select({
        id: partnershipAgreements.id,
        partnerId: partnershipAgreements.partnerId,
        agreementNumber: partnershipAgreements.agreementNumber,
        agreementType: partnershipAgreements.agreementType,
        effectiveDate: partnershipAgreements.effectiveDate,
        expiryDate: partnershipAgreements.expiryDate,
        isActive: partnershipAgreements.isActive,
        globalDiscountPercentage: partnershipAgreements.globalDiscountPercentage,
        maxDiscountPerVisit: partnershipAgreements.maxDiscountPerVisit,
        maxDiscountPerYear: partnershipAgreements.maxDiscountPerYear,
        notes: partnershipAgreements.notes,
        createdAt: partnershipAgreements.createdAt,
        updatedAt: partnershipAgreements.updatedAt,
        partnerName: corporatePartners.companyName,
      })
      .from(partnershipAgreements)
      .leftJoin(corporatePartners, eq(partnershipAgreements.partnerId, corporatePartners.id))
      .where(whereCondition)
      .orderBy(desc(partnershipAgreements.createdAt))

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Failed to fetch partnership agreements:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch partnership agreements' }, { status: 500 })
  }
}
