import { NextResponse } from 'next/server'
import { db } from '@/db'
import { communes, provinces } from '@/db/schema'
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
      whereCondition = like(communes.name, `%${search}%`)
    }

    const countResult = search
      ? await db
        .select({ count: count() })
        .from(communes)
        .where(whereCondition)
      : await db.select({ count: count() }).from(communes)

    const total = countResult[0]?.count || 0

    let query = db
      .select({
        id: communes.id,
        name: communes.name,
        provinceId: communes.provinceId,
        provinceName: provinces.name,
        createdAt: communes.createdAt,
      })
      .from(communes)
      .leftJoin(provinces, eq(communes.provinceId, provinces.id))
      .$dynamic()

    if (search) {
      query = query.where(whereCondition)
    }

    const allCommunes = await query.limit(limit).offset(offset)

    return NextResponse.json({

      data: allCommunes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch communes:', error)
    return NextResponse.json({ error: 'Failed to fetch communes' }, { status: 500 })
  }
}
