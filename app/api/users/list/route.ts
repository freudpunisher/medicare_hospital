import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { like, count } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''

    const offset = (page - 1) * limit

    // Build where clause for search
    let whereCondition = undefined
    if (search) {
      whereCondition = like(users.username, `%${search}%`)
    }

    // Get total count
    const countResult = search
      ? await db
          .select({ count: count() })
          .from(users)
          .where(whereCondition)
      : await db.select({ count: count() }).from(users)

    const total = countResult[0]?.count || 0

    // Get paginated data
    let query = db.select().from(users)
    if (search) {
      query = query.where(whereCondition)
    }
    query = query.limit(limit).offset(offset)

    const allUsers = await query

    return NextResponse.json({
      data: allUsers,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    console.error('Failed to fetch users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
}
