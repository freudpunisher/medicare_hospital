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
            .select({ userId: sessions.userId, expiresAt: sessions.expiresAt })
            .from(sessions)
            .where(eq(sessions.token, token))

        if (!session) return null

        // Enforce server-side expiry: expired sessions are invalidated
        if (session.expiresAt && new Date(session.expiresAt).getTime() < Date.now()) {
            await db.delete(sessions).where(eq(sessions.token, token))
            return null
        }

        return session?.userId ?? null
    } catch {
        return null
    }
}
