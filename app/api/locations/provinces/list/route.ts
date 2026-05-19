import { NextResponse } from 'next/server'
import { db } from '@/db'
import { provinces, communes, quartiers } from '@/db/schema'
import { like, count, eq } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const offset = (page - 1) * limit

    let whereCondition = undefined
    if (search) {
      whereCondition = like(provinces.name, `%${search}%`)
    }

    const countResult = search
      ? await db
          .select({ count: count() })
          .from(provinces)
          .where(whereCondition)
      : await db.select({ count: count() }).from(provinces)

    const total = countResult[0]?.count || 0

    let query = db.select().from(provinces)
    if (search) {
      query = query.where(whereCondition)
    }
    query = query.limit(limit).offset(offset)

    const allProvinces = await query

    return NextResponse.json({
      data: allProvinces,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch provinces:', error)
    return NextResponse.json({ error: 'Failed to fetch provinces' }, { status: 500 })
  }
}
