import { NextResponse } from 'next/server'
import { db } from '@/db'
import { specialties, departments } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const list = await db.select({
      id: specialties.id,
      name: specialties.name,
      description: specialties.description,
      isActive: specialties.isActive,
      departmentId: specialties.departmentId,
      departmentName: departments.name,
    })
      .from(specialties)
      .leftJoin(departments, eq(specialties.departmentId, departments.id))
      .orderBy(specialties.name)

    return NextResponse.json({
      success: true,
      data: list
    })
  } catch (error) {
    console.error('Failed to fetch specialties:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch specialties'
    }, { status: 500 })
  }
}
