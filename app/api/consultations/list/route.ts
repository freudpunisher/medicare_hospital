import { NextResponse } from 'next/server'
import { db } from '@/db'
import { visits, patients, users } from '@/db/schema'
import { and, count, desc, eq, like, or, sql, gte, lte } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = (searchParams.get('search') || '').trim()
    const status = searchParams.get('status') || 'all'
    const type = searchParams.get('type') || 'all'
    const dateFrom = searchParams.get('dateFrom') || ''
    const dateTo = searchParams.get('dateTo') || ''

    const offset = (page - 1) * limit

    const filters = []
    if (status !== 'all') filters.push(eq(visits.status, status))
    if (type !== 'all') filters.push(eq(visits.consultationType, type))
    if (dateFrom) filters.push(gte(visits.visitDate, new Date(dateFrom)))
    if (dateTo) filters.push(lte(visits.visitDate, new Date(dateTo + 'T23:59:59')))
    if (search) {
      const searchFilter = or(
        like(visits.consultationNumber, `%${search}%`),
        sql`EXISTS (SELECT 1 FROM ${patients} WHERE ${patients.id} = ${visits.patientId} AND (
          ${patients.firstName} ILIKE ${'%' + search + '%'} OR
          ${patients.lastName} ILIKE ${'%' + search + '%'} OR
          ${patients.phone} ILIKE ${'%' + search + '%'}
        ))`,
        sql`EXISTS (SELECT 1 FROM ${users} WHERE ${users.id} = ${visits.doctorId} AND ${users.fullName} ILIKE ${'%' + search + '%'})`,
      )
      filters.push(searchFilter)
    }

    const whereCondition = filters.length > 0 ? and(...filters) : undefined

    const countResult = whereCondition
      ? await db.select({ count: count() }).from(visits).where(whereCondition)
      : await db.select({ count: count() }).from(visits)

    const total = countResult[0]?.count || 0

    // Aggregate stats
    const statsRows = await db.select({
      total: count(),
      today: sql<number>`COUNT(*) FILTER (WHERE visit_date::date = CURRENT_DATE)`,
      thisWeek: sql<number>`COUNT(*) FILTER (WHERE visit_date >= date_trunc('week', CURRENT_DATE))`,
      pending: sql<number>`COUNT(*) FILTER (WHERE status = 'waiting' OR status = 'in_consultation')`,
      completed: sql<number>`COUNT(*) FILTER (WHERE status = 'completed')`,
      cancelled: sql<number>`COUNT(*) FILTER (WHERE status = 'cancelled')`,
    }).from(visits)

    const stats = statsRows[0] || { total: 0, today: 0, thisWeek: 0, pending: 0, completed: 0, cancelled: 0 }

    const data = await db.query.visits.findMany({
      where: whereCondition,
      orderBy: desc(visits.visitDate),
      limit,
      offset,
      with: {
        patient: true,
        doctor: true,
      },
    })

    return NextResponse.json({
      success: true,
      data,
      stats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch consultations:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch consultations' }, { status: 500 })
  }
}
