import { NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { hashPassword } from '@/lib/auth'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { username, password, fullName } = body

    if (!username || !password || !fullName) {
      return NextResponse.json(
        { error: 'Missing required fields: username, password, fullName' },
        { status: 400 }
      )
    }

    // Check if user already exists
    // const [existing] = await db.select().from(users).where(users.username.equals(username))
        const [existing] = await db.select().from(users).where(eq(users.username, username))

    console.log('Checking for existing user with username:', username)

    console.log('Existing user:', existing)
    if (existing) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    }

    // Hash password
    const passwordHash = hashPassword(password)

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        username,
        passwordHash,
        fullName,
      })
      .returning()

    return NextResponse.json(
      { id: newUser.id, username: newUser.username, fullName: newUser.fullName },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create user:', error)
    return NextResponse.json({ error: 'Failed to create user' }, { status: 500 })
  }
}
