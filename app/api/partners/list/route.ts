import { NextResponse } from 'next/server'
import { db } from '@/db'
import { corporatePartners } from '@/db/schema'
import { asc } from 'drizzle-orm'

export async function GET() {
  try {
    const data = await db.select().from(corporatePartners).orderBy(asc(corporatePartners.companyName))
    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Failed to fetch corporate partners:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch corporate partners' }, { status: 500 })
  }
}
