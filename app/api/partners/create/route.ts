import { NextResponse } from 'next/server'
import { db } from '@/db'
import { corporatePartners } from '@/db/schema'

export async function POST(req: Request) {
  try {
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
    } = body

    const [newPartner] = await db
      .insert(corporatePartners)
      .values({
        companyName,
        registrationNumber: registrationNumber ?? null,
        taxId: taxId ?? null,
        contactPerson: contactPerson ?? null,
        contactEmail: contactEmail ?? null,
        contactPhone: contactPhone ?? null,
        address: address ?? null,
        website: website ?? null,
        partnershipStartDate,
        partnershipEndDate: partnershipEndDate ?? null,
        autoRenew: autoRenew ?? false,
        notes: notes ?? null,
      })
      .returning()

    return NextResponse.json({ success: true, data: newPartner }, { status: 201 })
  } catch (error) {
    console.error('Failed to create corporate partner:', error)
    return NextResponse.json({ success: false, error: 'Failed to create corporate partner' }, { status: 500 })
  }
}
