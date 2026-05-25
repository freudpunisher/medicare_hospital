import { NextResponse } from 'next/server'
import { db } from '@/db'
import { acts } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { isActive } = body

        if (typeof isActive !== 'boolean') {
            return NextResponse.json({ error: 'isActive must be a boolean' }, { status: 400 })
        }

        const result = await db
            .update(acts)
            .set({ isActive })
            .where(eq(acts.id, id))
            .returning()

        if (result.length === 0) {
            return NextResponse.json({ error: 'Act not found' }, { status: 404 })
        }

        return NextResponse.json(result[0], { status: 200 })
    } catch (error) {
        console.error('Failed to update act:', error)
        return NextResponse.json({ error: 'Failed to update act' }, { status: 500 })
    }
}
