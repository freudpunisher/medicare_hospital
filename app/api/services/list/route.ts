import { NextResponse } from 'next/server'
import { db } from '@/db'
import { services, medicalActs } from '@/db/schema'
import { sql } from 'drizzle-orm'

export async function GET() {
  try {
    const list = await db.select({
      id: services.id,
      name: services.name,
      code: services.code,
      type: services.type,
      description: services.description,
      isBillable: services.isBillable,
      isActive: services.isActive,
      createdAt: services.createdAt,
      actCount: sql<number>`(
        select count(*)::int 
        from ${medicalActs} 
        where service_id = ${services.id}
      )`
    })
      .from(services)
      .orderBy(services.name)

    return NextResponse.json({
      success: true,
      data: list
    })
  } catch (error) {
    console.error('Failed to fetch services:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch services'
    }, { status: 500 })
  }
}
