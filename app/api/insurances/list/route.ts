import { NextResponse } from 'next/server'
import { db } from '@/db'
import { insurances } from '@/db/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
  try {
    const list = await db.select()
      .from(insurances)
      .orderBy(desc(insurances.createdAt))

    return NextResponse.json({
      success: true,
      data: list
    })
  } catch (error) {
    console.error('Failed to fetch insurances:', error)
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch insurance providers'
    }, { status: 500 })
  }
}
