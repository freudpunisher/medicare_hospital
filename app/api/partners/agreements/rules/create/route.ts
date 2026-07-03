import { NextResponse } from 'next/server'
import { db } from '@/db'
import { partnershipServiceRules } from '@/db/schema'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      partnerId,
      agreementId,
      serviceId,
      medicalActId,
      specialtyId,
      reductionType,
      reductionValue,
      maxReductionAmount,
      minBillableAmount,
      priority,
      notes,
    } = body

    const [newRule] = await db
      .insert(partnershipServiceRules)
      .values({
        partnerId,
        agreementId,
        serviceId: serviceId ?? null,
        medicalActId: medicalActId ?? null,
        specialtyId: specialtyId ?? null,
        reductionType,
        reductionValue,
        maxReductionAmount: maxReductionAmount ?? null,
        minBillableAmount: minBillableAmount ?? null,
        priority: priority ?? '1',
        notes: notes ?? null,
      })
      .returning()

    return NextResponse.json({ success: true, data: newRule }, { status: 201 })
  } catch (error) {
    console.error('Failed to create partnership service rule:', error)
    return NextResponse.json({ success: false, error: 'Failed to create partnership service rule' }, { status: 500 })
  }
}
