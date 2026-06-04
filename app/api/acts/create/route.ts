import { NextResponse } from 'next/server'
import { db } from '@/db'
import { medicalActs } from '@/db/schema'
import { desc, sql } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, serviceId, specialtyId, basePrice, requiresAuthorization } = body

    if (!name || !serviceId) {
      return NextResponse.json({
        success: false,
        error: 'Le nom et le service sont requis'
      }, { status: 400 })
    }

    // Automatic Code Generation: ACT-001, ACT-002...
    const lastAct = await db.select({ code: medicalActs.code })
      .from(medicalActs)
      .where(sql`code LIKE 'ACT-%'`)
      .orderBy(desc(medicalActs.code))
      .limit(1)

    let nextCode = 'ACT-001'
    if (lastAct.length > 0) {
      const lastCode = lastAct[0].code
      const lastNum = parseInt(lastCode.split('-')[1])
      if (!isNaN(lastNum)) {
        nextCode = `ACT-${(lastNum + 1).toString().padStart(3, '0')}`
      }
    }

    const [newAct] = await db.insert(medicalActs).values({
      code: nextCode,
      name,
      serviceId,
      specialtyId,
      basePrice: basePrice?.toString() || '0',
      requiresAuthorization: requiresAuthorization ?? false,
      isActive: true,
    }).returning()

    return NextResponse.json({
      success: true,
      data: newAct
    })
  } catch (error: any) {
    console.error('Failed to create medical act:', error)
    if (error.code === '23505') {
      return NextResponse.json({
        success: false,
        error: 'Un acte médical avec ce nom existe déjà'
      }, { status: 400 })
    }
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la création de l\'acte'
    }, { status: 500 })
  }
}
