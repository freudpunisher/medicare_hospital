import { db } from './index'
import { users } from './schema'
import { eq } from 'drizzle-orm'
import { hashPassword } from '../lib/auth'

async function seedAdmin() {
    console.log('👤 Starting admin user seed...')

    const username = process.env.ADMIN_USERNAME || 'admin'
    const password = process.env.ADMIN_PASSWORD || 'Admin@1234'
    const fullName = process.env.ADMIN_FULLNAME || 'Administrateur Système'

    try {
        // Check if admin already exists
        const [existingAdmin] = await db
            .select()
            .from(users)
            .where(eq(users.username, username))

        if (existingAdmin) {
            console.log(`ℹ️  User '${username}' already exists. Skipping create.`)
            return
        }

        // Hash and insert
        console.log(`🔨 Creating admin user: ${username}`)
        const passwordHash = hashPassword(password)

        await db.insert(users).values({
            username,
            passwordHash,
            fullName,
            role: 'admin',
        })

        console.log('✅ Admin user created successfully!')
    } catch (error) {
        console.error('❌ Admin seed failed:', error)
        process.exit(1)
    }
}

seedAdmin()
