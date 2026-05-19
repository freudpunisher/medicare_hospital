import { NextResponse } from 'next/server'
import { db } from '@/db'
import { communes } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const provinceId = searchParams.get('provinceId')

    if (!provinceId) {
      return NextResponse.json({ error: 'provinceId is required' }, { status: 400 })
    }

    const allCommunes = await db
      .select()
      .from(communes)
      .where(eq(communes.provinceId, provinceId))

    return NextResponse.json(allCommunes)
  } catch (error) {
    console.error('Failed to fetch communes:', error)
    return NextResponse.json({ error: 'Failed to fetch communes' }, { status: 500 })
  }
}
export async function POST(req: Request) {
  try {
    const { name, provinceId } = await req.json()
    if (!name || !provinceId) return NextResponse.json({ error: 'Name and provinceId are required' }, { status: 400 })
    const [newCommune] = await db.insert(communes).values({ name, provinceId }).returning()
    return NextResponse.json(newCommune)
  } catch (error) {
    console.error('Failed to create commune:', error)
    return NextResponse.json({ error: 'Failed to create commune' }, { status: 500 })
  }
}
