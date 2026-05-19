import { NextResponse } from 'next/server'
import { db } from '@/db'
import { medicalActs } from '@/db/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  try {
    const data = await db.select().from(medicalActs).orderBy(desc(medicalActs.createdAt))
    return NextResponse.json({ data })
  } catch (error) {
    console.error('Failed to fetch medical acts:', error)
    return NextResponse.json({ error: 'Failed to fetch medical acts' }, { status: 500 })
  }
}
