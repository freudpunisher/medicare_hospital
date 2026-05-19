import { NextResponse } from 'next/server'
import { db } from '@/db'
import { sessions } from '@/db/schema'
import { eq } from 'drizzle-orm'

function parseSessionToken(cookieHeader: string | null) {
  if (!cookieHeader) return null
  const match = cookieHeader.match(/session=([^;]+)/)
  return match ? match[1] : null
}

export async function POST(req: Request) {
  try {
    const cookie = req.headers.get('cookie') || ''
    const token = parseSessionToken(cookie)
    if (token) {
      await db.delete(sessions).where(eq(sessions.token, token))
    }

    const headers = new Headers()
    headers.append('Set-Cookie', `session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)

    return new NextResponse(null, { status: 204, headers })
  } catch (err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
