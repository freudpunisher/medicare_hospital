import { NextResponse } from 'next/server'
import { db } from '@/db'
import { corporatePartners, corporateEmployees, partnershipAgreements } from '@/db/schema'
import { eq, count } from 'drizzle-orm'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const partner = await db.query.corporatePartners.findFirst({
      where: eq(corporatePartners.id, id),
    })

    if (!partner) {
      return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 })
    }

    const [employeeCount] = await db
      .select({ count: count() })
      .from(corporateEmployees)
      .where(eq(corporateEmployees.partnerId, id))

    const [agreementCount] = await db
      .select({ count: count() })
      .from(partnershipAgreements)
      .where(eq(partnershipAgreements.partnerId, id))

    return NextResponse.json({
      success: true,
      data: {
        ...partner,
        employeeCount: Number(employeeCount.count),
        agreementCount: Number(agreementCount.count),
      },
    })
  } catch (error) {
    console.error('Failed to fetch partner:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch partner' }, { status: 500 })
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
      companyName,
      registrationNumber,
      taxId,
      contactPerson,
      contactEmail,
      contactPhone,
      address,
      website,
      partnershipStartDate,
      partnershipEndDate,
      autoRenew,
      notes,
      isActive,
    } = body

    const updateData: Record<string, unknown> = {}
    if (companyName !== undefined) updateData.companyName = companyName
    if (registrationNumber !== undefined) updateData.registrationNumber = registrationNumber
    if (taxId !== undefined) updateData.taxId = taxId
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson
    if (contactEmail !== undefined) updateData.contactEmail = contactEmail
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone
    if (address !== undefined) updateData.address = address
    if (website !== undefined) updateData.website = website
    if (partnershipStartDate !== undefined) updateData.partnershipStartDate = partnershipStartDate
    if (partnershipEndDate !== undefined) updateData.partnershipEndDate = partnershipEndDate
    if (autoRenew !== undefined) updateData.autoRenew = autoRenew
    if (notes !== undefined) updateData.notes = notes
    if (isActive !== undefined) updateData.isActive = isActive

    const [updated] = await db
      .update(corporatePartners)
      .set(updateData)
      .where(eq(corporatePartners.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Failed to update partner:', error)
    return NextResponse.json({ success: false, error: 'Failed to update partner' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [deleted] = await db
      .delete(corporatePartners)
      .where(eq(corporatePartners.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Partner not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: deleted })
  } catch (error) {
    console.error('Failed to delete partner:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete partner' }, { status: 500 })
  }
}
