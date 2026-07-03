import { NextResponse } from 'next/server'
import { db } from '@/db'
import { partnershipAgreements } from '@/db/schema'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      partnerId,
      agreementNumber,
      agreementType,
      effectiveDate,
      expiryDate,
      globalDiscountPercentage,
      maxDiscountPerVisit,
      maxDiscountPerYear,
      notes,
    } = body

    const [newAgreement] = await db
      .insert(partnershipAgreements)
      .values({
        partnerId,
        agreementNumber,
        agreementType,
        effectiveDate,
        expiryDate: expiryDate ?? null,
        globalDiscountPercentage: globalDiscountPercentage ?? null,
        maxDiscountPerVisit: maxDiscountPerVisit ?? null,
        maxDiscountPerYear: maxDiscountPerYear ?? null,
        notes: notes ?? null,
      })
      .returning()

    return NextResponse.json({ success: true, data: newAgreement }, { status: 201 })
  } catch (error) {
    console.error('Failed to create partnership agreement:', error)
    return NextResponse.json({ success: false, error: 'Failed to create partnership agreement' }, { status: 500 })
  }
}
