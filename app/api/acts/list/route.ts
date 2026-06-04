import { NextResponse } from 'next/server'
import { db } from '@/db'
import { medicalActs, services, specialties } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const list = await db.select({
      id: medicalActs.id,
      code: medicalActs.code,
      name: medicalActs.name,
      basePrice: medicalActs.basePrice,
      requiresAuthorization: medicalActs.requiresAuthorization,
      isActive: medicalActs.isActive,
      serviceId: medicalActs.serviceId,
      serviceName: services.name,
      specialtyId: medicalActs.specialtyId,
      specialtyName: specialties.name,
    })
      .from(medicalActs)
      .leftJoin(services, eq(medicalActs.serviceId, services.id))
      .leftJoin(specialties, eq(medicalActs.specialtyId, specialties.id))
      .orderBy(desc(medicalActs.createdAt))

    return NextResponse.json({
      success: true,
      data: list
    })
  } catch (error) {
    console.error('Failed to fetch acts:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch medical acts'
    }, { status: 500 })
  }
}
