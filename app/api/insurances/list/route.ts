import { NextResponse } from 'next/server'
import { db } from '@/db'
import { insurances } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get('active') === 'true'

    const query = activeOnly
      ? db.select().from(insurances).where(eq(insurances.isActive, true))
      : db.select().from(insurances)

    const items = await query.orderBy(insurances.name)

    return NextResponse.json({ data: items })
  } catch (error) {
    console.error('Failed to fetch insurances:', error)
    return NextResponse.json({ error: 'Failed to fetch insurances' }, { status: 500 })
  }
}
