import { NextResponse } from 'next/server'
import { db } from '@/db'
import { departments, specialties } from '@/db/schema'
import { eq, sql } from 'drizzle-orm'

export async function GET() {
    try {
        const list = await db.select({
            id: departments.id,
            name: departments.name,
            description: departments.description,
            isActive: departments.isActive,
            createdAt: departments.createdAt,
            specialtyCount: sql<number>`(
        select count(*)::int 
        from ${specialties} 
        where department_id = ${departments.id}
      )`
        })
            .from(departments)
            .orderBy(departments.name)

        return NextResponse.json({
            success: true,
            data: list
        })
    } catch (error) {
        console.error('Failed to fetch departments:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch departments'
        }, { status: 500 })
    }
}
