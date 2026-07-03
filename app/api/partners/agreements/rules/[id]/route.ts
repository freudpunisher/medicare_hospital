import { NextResponse } from 'next/server'
import { db } from '@/db'
import { partnershipServiceRules } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const rule = await db.query.partnershipServiceRules.findFirst({
      where: eq(partnershipServiceRules.id, id),
      with: {
        partner: true,
        agreement: true,
        service: true,
        medicalAct: true,
        specialty: true,
      },
    })

    if (!rule) {
      return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: rule })
  } catch (error) {
    console.error('Failed to fetch rule:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch rule' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
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
      isActive,
      priority,
      notes,
    } = body

    const updateData: Record<string, unknown> = {}
    if (partnerId !== undefined) updateData.partnerId = partnerId
    if (agreementId !== undefined) updateData.agreementId = agreementId
    if (serviceId !== undefined) updateData.serviceId = serviceId
    if (medicalActId !== undefined) updateData.medicalActId = medicalActId
    if (specialtyId !== undefined) updateData.specialtyId = specialtyId
    if (reductionType !== undefined) updateData.reductionType = reductionType
    if (reductionValue !== undefined) updateData.reductionValue = reductionValue
    if (maxReductionAmount !== undefined) updateData.maxReductionAmount = maxReductionAmount
    if (minBillableAmount !== undefined) updateData.minBillableAmount = minBillableAmount
    if (isActive !== undefined) updateData.isActive = isActive
    if (priority !== undefined) updateData.priority = priority
    if (notes !== undefined) updateData.notes = notes

    const [updated] = await db
      .update(partnershipServiceRules)
      .set(updateData)
      .where(eq(partnershipServiceRules.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Failed to update rule:', error)
    return NextResponse.json({ success: false, error: 'Failed to update rule' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [deleted] = await db
      .delete(partnershipServiceRules)
      .where(eq(partnershipServiceRules.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Rule not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: deleted })
  } catch (error) {
    console.error('Failed to delete rule:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete rule' }, { status: 500 })
  }
}
