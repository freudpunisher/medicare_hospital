import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users, sessions } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { verifyPassword, createSessionToken } from '@/lib/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const { username, password } = body || {}
    if (!username || !password) {
      return NextResponse.json({ error: 'Missing credentials' }, { status: 400 })
    }

    const [user] = await db.select().from(users).where(eq(users.username, username))
    if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    const ok = verifyPassword(password, user.passwordHash)
    if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })

    // create and persist a session token
    const token = createSessionToken()
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7)
    await db.insert(sessions).values({ userId: user.id, token, expiresAt })

    const headers = new Headers()
    // cookie valid for 7 days
    headers.append('Set-Cookie', `session=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`)

    return new NextResponse(JSON.stringify({ id: user.id, username: user.username, fullName: user.fullName }), {
      status: 200,
      headers,
    })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
