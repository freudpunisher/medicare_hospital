import { NextResponse } from 'next/server'
import { db } from '@/db'
import { quartiers } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const zoneId = searchParams.get('zoneId')

    if (!zoneId) {
      return NextResponse.json({ error: 'zoneId is required' }, { status: 400 })
    }

    const allQuartiers = await db
      .select()
      .from(quartiers)
      .where(eq(quartiers.zoneId, zoneId))


    return NextResponse.json(allQuartiers)
  } catch (error) {
    console.error('Failed to fetch quartiers:', error)
    return NextResponse.json({ error: 'Failed to fetch quartiers' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, zoneId } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const [newQuartier] = await db.insert(quartiers).values({ name, ...(zoneId ? { zoneId } : {}) }).returning()
    return NextResponse.json(newQuartier)
  } catch (error) {
    console.error('Failed to create quartier:', error)
    return NextResponse.json({ error: 'Failed to create quartier' }, { status: 500 })
  }
}

