import { NextResponse } from 'next/server'
import { db } from '@/db'
import { zones } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const communeId = searchParams.get('communeId')

        if (!communeId) {
            return NextResponse.json({ error: 'communeId is required' }, { status: 400 })
        }

        const allZones = await db
            .select()
            .from(zones)
            .where(eq(zones.communeId, communeId))

        return NextResponse.json(allZones)
    } catch (error) {
        console.error('Failed to fetch zones:', error)
        return NextResponse.json({ error: 'Failed to fetch zones' }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const { name, communeId } = await req.json()
        if (!name || !communeId) return NextResponse.json({ error: 'Name and communeId are required' }, { status: 400 })
        const [newZone] = await db.insert(zones).values({ name, communeId }).returning()
        return NextResponse.json(newZone)
    } catch (error) {
        console.error('Failed to create zone:', error)
        return NextResponse.json({ error: 'Failed to create zone' }, { status: 500 })
    }
}

