import { NextResponse } from 'next/server'
import { db } from '@/db'
import { services } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const activeOnly = searchParams.get('active') === 'true'

    const query = activeOnly
      ? db.select().from(services).where(eq(services.isActive, true))
      : db.select().from(services)

    const data = await query.orderBy(services.name)
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Failed to fetch services:', error)
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 })
  }
}
