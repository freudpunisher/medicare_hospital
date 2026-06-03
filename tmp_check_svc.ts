import { db } from './db'
import { services } from './db/schema'
import { desc } from 'drizzle-orm'

async function check() {
    const list = await db.select({ code: services.code }).from(services).orderBy(desc(services.code)).limit(1)
    console.log(JSON.stringify(list))
    process.exit(0)
}

check()
