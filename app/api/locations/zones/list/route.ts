import { NextResponse } from 'next/server'
import { db } from '@/db'
import { zones, communes } from '@/db/schema'
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
            whereCondition = like(zones.name, `%${search}%`)
        }

        const countResult = search
            ? await db
                .select({ count: count() })
                .from(zones)
                .where(whereCondition)
            : await db.select({ count: count() }).from(zones)

        const total = countResult[0]?.count || 0

        let query = db
            .select({
                id: zones.id,
                name: zones.name,
                communeId: zones.communeId,
                communeName: communes.name,
                createdAt: zones.createdAt,
            })
            .from(zones)
            .leftJoin(communes, eq(zones.communeId, communes.id))
            .$dynamic()

        if (search) {
            query = query.where(whereCondition)
        }

        const allZones = await query.limit(limit).offset(offset)


        return NextResponse.json({
            data: allZones,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        })
    } catch (error) {
        console.error('Failed to fetch zones:', error)
        return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 })
    }
}
