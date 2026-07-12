import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { userId, specialtyId, phone, email, licenseNumber } = body

    if (!userId || !specialtyId || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, specialtyId, phone' },
        { status: 400 }
      )
    }

    const [targetUser] = await db
      .select()
      .from(users)
      .where(and(eq(users.id, userId), eq(users.role, 'doctor'), isNull(users.specialtyId)))

    if (!targetUser) {
      return NextResponse.json({ error: 'Utilisateur non trouvé ou déjà configuré' }, { status: 404 })
    }

    const [existingPhone] = await db
      .select()
      .from(users)
      .where(and(eq(users.phone, phone), eq(users.id, userId)))

    if (existingPhone) {
      return NextResponse.json({ error: 'Numéro de téléphone déjà utilisé' }, { status: 409 })
    }

    const [updated] = await db
      .update(users)
      .set({ specialtyId, phone, email, licenseNumber })
      .where(eq(users.id, userId))
      .returning()

    return NextResponse.json({
      success: true,
      data: {
        id: updated.id,
        fullName: updated.fullName,
        phone: updated.phone,
        email: updated.email,
        licenseNumber: updated.licenseNumber,
        isActive: updated.isActive,
        specialty: null,
      },
    })
  } catch (error: any) {
    console.error('Failed to create doctor:', error)
    return NextResponse.json({ error: error.message || 'Failed to create doctor' }, { status: 500 })
  }
}
