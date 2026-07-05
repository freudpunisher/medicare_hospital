import { NextResponse } from 'next/server'
import { db } from '@/db'
import { partnershipAgreements, partnershipServiceRules } from '@/db/schema'
import { eq, and, isNull, count } from 'drizzle-orm'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const agreement = await db.query.partnershipAgreements.findFirst({
      where: eq(partnershipAgreements.id, id),
      with: {
        partner: true,
      },
    })

    if (!agreement) {
      return NextResponse.json({ success: false, error: 'Agreement not found' }, { status: 404 })
    }

    const [rulesCount] = await db
      .select({ count: count() })
      .from(partnershipServiceRules)
      .where(eq(partnershipServiceRules.agreementId, id))

    return NextResponse.json({
      success: true,
      data: {
        ...agreement,
        rulesCount: Number(rulesCount.count),
      },
    })
  } catch (error) {
    console.error('Failed to fetch agreement:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch agreement' }, { status: 500 })
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
      agreementNumber,
      agreementType,
      effectiveDate,
      expiryDate,
      isActive,
      globalDiscountPercentage,
      maxDiscountPerVisit,
      maxDiscountPerYear,
      notes,
    } = body

    const updateData: Record<string, unknown> = {}
    if (partnerId !== undefined) updateData.partnerId = partnerId
    if (agreementNumber !== undefined) updateData.agreementNumber = agreementNumber
    if (agreementType !== undefined) updateData.agreementType = agreementType
    if (effectiveDate !== undefined) updateData.effectiveDate = new Date(effectiveDate)
    if (expiryDate !== undefined) updateData.expiryDate = expiryDate ? new Date(expiryDate) : null
    if (isActive !== undefined) updateData.isActive = isActive
    if (globalDiscountPercentage !== undefined) updateData.globalDiscountPercentage = globalDiscountPercentage
    if (maxDiscountPerVisit !== undefined) updateData.maxDiscountPerVisit = maxDiscountPerVisit
    if (maxDiscountPerYear !== undefined) updateData.maxDiscountPerYear = maxDiscountPerYear
    if (notes !== undefined) updateData.notes = notes

    const result = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(partnershipAgreements)
        .set(updateData)
        .where(eq(partnershipAgreements.id, id))
        .returning()

      if (!updated) {
        return null
      }

      if (globalDiscountPercentage !== undefined) {
        const catchAllFilter = and(
          eq(partnershipServiceRules.agreementId, id),
          isNull(partnershipServiceRules.serviceId),
          isNull(partnershipServiceRules.medicalActId),
          isNull(partnershipServiceRules.specialtyId),
        )

        if (globalDiscountPercentage != null) {
          const [existing] = await tx
            .select()
            .from(partnershipServiceRules)
            .where(catchAllFilter)
            .limit(1)

          if (existing) {
            await tx
              .update(partnershipServiceRules)
              .set({ reductionValue: globalDiscountPercentage })
              .where(eq(partnershipServiceRules.id, existing.id))
          } else {
            await tx.insert(partnershipServiceRules).values({
              partnerId: updated.partnerId,
              agreementId: id,
              reductionType: 'percentage',
              reductionValue: globalDiscountPercentage,
              priority: '999',
              notes: 'Remise globale - catch-all',
            })
          }
        } else {
          await tx
            .delete(partnershipServiceRules)
            .where(catchAllFilter)
        }
      }

      return updated
    })

    if (!result) {
      return NextResponse.json({ success: false, error: 'Agreement not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    console.error('Failed to update agreement:', error)
    return NextResponse.json({ success: false, error: 'Failed to update agreement' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [deleted] = await db
      .delete(partnershipAgreements)
      .where(eq(partnershipAgreements.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Agreement not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: deleted })
  } catch (error) {
    console.error('Failed to delete agreement:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete agreement' }, { status: 500 })
  }
}


