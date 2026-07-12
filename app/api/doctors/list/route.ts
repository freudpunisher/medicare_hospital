import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq, and, isNull } from 'drizzle-orm'

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const active = searchParams.get('active')
    const unassigned = searchParams.get('unassigned')

    const filters = [eq(users.role, 'doctor')]
    if (active === 'true') filters.push(eq(users.isActive, true))
    if (unassigned !== 'false') filters.push(isNull(users.specialtyId))

    const data = await db.query.users.findMany({
      where: and(...filters),
      with: {
        specialty: true,
      },
      orderBy: (users, { asc }) => [asc(users.createdAt)],
    })

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error('Failed to fetch doctors:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch doctors' }, { status: 500 })
  }
}
