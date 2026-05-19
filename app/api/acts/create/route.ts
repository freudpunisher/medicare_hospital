import { NextResponse } from 'next/server'
import { db } from '@/db'
import { medicalActs } from '@/db/schema'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      code,
      name,
      serviceId,
      specialtyId,
      basePrice,
      requiresAuthorization = false,
      isActive = true,
    } = body

    if (!code || !name || !serviceId || basePrice === undefined || basePrice === null) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const normalizedBasePrice =
      typeof basePrice === 'string' && basePrice.trim() !== ''
        ? basePrice.trim()
        : Number.isFinite(Number(basePrice))
          ? Number(basePrice).toFixed(2)
          : null

    if (!normalizedBasePrice) {
      return NextResponse.json({ error: 'Invalid base price' }, { status: 400 })
    }

    const created = await db
      .insert(medicalActs)
      .values({
        code: String(code).toUpperCase(),
        name,
        serviceId,
        specialtyId: specialtyId ?? null,
        basePrice: normalizedBasePrice,
        requiresAuthorization: Boolean(requiresAuthorization),
        isActive: Boolean(isActive),
      })
      .returning()

    return NextResponse.json(created[0], { status: 201 })
  } catch (error) {
    console.error('Failed to create medical act:', error)
    return NextResponse.json({ error: 'Failed to create medical act' }, { status: 500 })
  }
}
