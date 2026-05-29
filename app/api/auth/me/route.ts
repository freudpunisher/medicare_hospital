import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/db'
import { sessions, users } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET() {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('session')?.value
        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const [session] = await db
            .select({ userId: sessions.userId })
            .from(sessions)
            .where(eq(sessions.token, token))

        if (!session) {
            return NextResponse.json({ error: 'Session not found' }, { status: 401 })
        }

        const [user] = await db
            .select({
                id: users.id,
                username: users.username,
                fullName: users.fullName,
                role: users.role,
            })
            .from(users)
            .where(eq(users.id, session.userId))

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        return NextResponse.json({ success: true, data: user })
    } catch (err) {
        console.error('[/api/auth/me]', err)
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
