import { NextResponse } from 'next/server'
import { db } from '@/db'
import { patients } from '@/db/schema'
import { and, count, desc, eq, like, or, sql } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = (searchParams.get('search') || '').trim()
    const filter = searchParams.get('filter') || 'all'

    const offset = (page - 1) * limit

    const filters = []
    if (filter === 'insured') filters.push(eq(patients.isInsured, true))
    if (filter === 'uninsured') filters.push(eq(patients.isInsured, false))
    if (search) {
      filters.push(
        or(
          like(patients.firstName, `%${search}%`),
          like(patients.lastName, `%${search}%`),
          like(patients.phone, `%${search}%`),
          like(sql`CAST(${patients.patientNumber} AS TEXT)`, `%${search}%`)
        )
      )
    }

    const whereCondition = filters.length > 0 ? and(...filters) : undefined

    // Count query
    const countQuery = whereCondition
      ? db.select({ count: count() }).from(patients).where(whereCondition)
      : db.select({ count: count() }).from(patients)

    const countResult = await countQuery
    const total = countResult[0]?.count || 0

    // Fetch patients with their insurances relation
    const data = await db.query.patients.findMany({
      where: whereCondition,
      orderBy: desc(patients.createdAt),
      limit,
      offset,
      with: {
        insurances: {
          with: {
            insurance: true,
          },
        },
      },
    })

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch patients:', error)
    return NextResponse.json({ error: 'Failed to fetch patients' }, { status: 500 })
  }
}
