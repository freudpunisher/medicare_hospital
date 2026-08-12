import { cookies } from "next/headers"
import { db } from "@/db"
import { sessions } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function getCurrentUserId(): Promise<string | null> {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get("session")?.value
        if (!token) return null

        const [session] = await db
            .select({ userId: sessions.userId })
            .from(sessions)
            .where(eq(sessions.token, token))

        return session?.userId ?? null
    } catch {
        return null
    }
}
