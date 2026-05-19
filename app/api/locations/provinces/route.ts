import { NextResponse } from 'next/server'
import { db } from '@/db'
import { provinces } from '@/db/schema'

export async function GET() {
  try {
    const allProvinces = await db.select().from(provinces)
    return NextResponse.json(allProvinces)
  } catch (error) {
    console.error('Failed to fetch provinces:', error)
    return NextResponse.json({ error: 'Failed to fetch provinces' }, { status: 500 })
  }
}
export async function POST(req: Request) {
  try {
    const { name } = await req.json()
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    const [newProvince] = await db.insert(provinces).values({ name }).returning()
    return NextResponse.json(newProvince)
  } catch (error) {
    console.error('Failed to create province:', error)
    return NextResponse.json({ error: 'Failed to create province' }, { status: 500 })
  }
}
