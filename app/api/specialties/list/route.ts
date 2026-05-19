import { NextResponse } from 'next/server'
import { db } from '@/db'
import { specialties } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get('active') === 'true'

    const query = activeOnly
      ? db.select().from(specialties).where(eq(specialties.isActive, true))
      : db.select().from(specialties)

    const data = await query.orderBy(specialties.name)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Failed to fetch specialties:', error)
    return NextResponse.json({ error: 'Failed to fetch specialties' }, { status: 500 })
  }
}
