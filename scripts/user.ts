#!/usr/bin/env tsx
import 'dotenv/config'
import { db } from '../db'
import { users } from '../db/schema'
import { hashPassword } from '../lib/auth'
import { eq } from 'drizzle-orm'

async function main() {
  const args = process.argv.slice(2)
  const username = args[0]
  const password = args[1]
  const fullName = args[2] ?? 'Administrator'
  const role = args[3] ?? 'admin'

  if (!username || !password) {
    console.error('Usage: npx tsx scripts/user.ts <username> <password> [fullName] [role]')
    process.exit(1)
  }

  const existing = await db.select().from(users).where(eq(users.username, username))
  if (existing.length > 0) {
    console.log(`User with username ${username} already exists. Updating password and role.`)
    const passwordHash = hashPassword(password)
    await db
      .update(users)
      .set({ passwordHash, fullName, role, isActive: true })
      .where(eq(users.username, username))
    console.log('User updated.')
    process.exit(0)
  }

  const passwordHash = hashPassword(password)
  await db.insert(users).values({ username, passwordHash, fullName, role, isActive: true })
  console.log(`User ${username} created with role=${role}`)
  process.exit(0)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
