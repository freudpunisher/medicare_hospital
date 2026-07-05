import { NextResponse } from 'next/server'
import { db } from '@/db'
import { partnershipAgreements, partnershipServiceRules } from '@/db/schema'
import { count } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      partnerId,
      agreementType,
      effectiveDate,
      expiryDate,
      globalDiscountPercentage,
      maxDiscountPerVisit,
      maxDiscountPerYear,
      notes,
    } = body

    const [{ total }] = await db.select({ total: count() }).from(partnershipAgreements)
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const seq = (Number(total) + 1).toString().padStart(4, '0')
    const agreementNumber = `CONV-${dateStr}-${seq}`

    const result = await db.transaction(async (tx) => {
      const [newAgreement] = await tx
        .insert(partnershipAgreements)
        .values({
          partnerId,
          agreementNumber,
          agreementType,
          effectiveDate: new Date(effectiveDate),
          expiryDate: expiryDate ? new Date(expiryDate) : null,
          globalDiscountPercentage: globalDiscountPercentage ?? null,
          maxDiscountPerVisit: maxDiscountPerVisit ?? null,
          maxDiscountPerYear: maxDiscountPerYear ?? null,
          notes: notes ?? null,
        })
        .returning()

      if (globalDiscountPercentage != null) {
        await tx.insert(partnershipServiceRules).values({
          partnerId,
          agreementId: newAgreement.id,
          reductionType: 'percentage',
          reductionValue: globalDiscountPercentage,
          priority: '999',
          notes: 'Remise globale - catch-all',
        })
      }

      return newAgreement
    })

    return NextResponse.json({ success: true, data: result }, { status: 201 })
  } catch (error) {
    console.error('Failed to create partnership agreement:', error)
    return NextResponse.json({ success: false, error: 'Failed to create partnership agreement' }, { status: 500 })
  }
}
