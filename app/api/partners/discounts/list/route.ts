import { NextResponse } from 'next/server'
import { db } from '@/db'
import { partnershipDiscountHistory, corporatePartners, invoiceItems, partnershipServiceRules, medicalActs } from '@/db/schema'
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
      filters.push(eq(partnershipDiscountHistory.partnerId, partnerId))
    }

    const whereCondition = filters.length > 0 ? and(...filters) : undefined

    const countQuery = whereCondition
      ? db.select({ count: count() }).from(partnershipDiscountHistory).where(whereCondition)
      : db.select({ count: count() }).from(partnershipDiscountHistory)

    const countResult = await countQuery
    const total = countResult[0]?.count || 0

    const data = await db
      .select({
        id: partnershipDiscountHistory.id,
        partnerId: partnershipDiscountHistory.partnerId,
        invoiceItemId: partnershipDiscountHistory.invoiceItemId,
        ruleId: partnershipDiscountHistory.ruleId,
        originalPrice: partnershipDiscountHistory.originalPrice,
        discountedPrice: partnershipDiscountHistory.discountedPrice,
        discountAmount: partnershipDiscountHistory.discountAmount,
        discountType: partnershipDiscountHistory.discountType,
        discountValue: partnershipDiscountHistory.discountValue,
        createdAt: partnershipDiscountHistory.createdAt,
        partnerName: corporatePartners.companyName,
        ruleReductionType: partnershipServiceRules.reductionType,
        ruleReductionValue: partnershipServiceRules.reductionValue,
        medicalActName: medicalActs.name,
      })
      .from(partnershipDiscountHistory)
      .leftJoin(corporatePartners, eq(partnershipDiscountHistory.partnerId, corporatePartners.id))
      .leftJoin(invoiceItems, eq(partnershipDiscountHistory.invoiceItemId, invoiceItems.id))
      .leftJoin(partnershipServiceRules, eq(partnershipDiscountHistory.ruleId, partnershipServiceRules.id))
      .leftJoin(medicalActs, eq(invoiceItems.medicalActId, medicalActs.id))
      .where(whereCondition)
      .orderBy(desc(partnershipDiscountHistory.createdAt))
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
    console.error('Failed to fetch partnership discount history:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch partnership discount history' }, { status: 500 })
  }
}
