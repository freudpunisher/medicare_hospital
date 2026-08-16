import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { db } from '@/db'
import { sessions, users } from '@/db/schema'
import { eq, and, ne } from 'drizzle-orm'
import { verifyPassword, hashPassword } from '@/lib/auth'

export async function POST(req: Request) {
    try {
        const cookieStore = await cookies()
        const token = cookieStore.get('session')?.value
        if (!token) {
            return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
        }

        const [session] = await db
            .select({ userId: sessions.userId })
            .from(sessions)
            .where(eq(sessions.token, token))

        if (!session) {
            return NextResponse.json({ error: 'Session invalide' }, { status: 401 })
        }

        const body = await req.json()
        const { currentPassword, newPassword } = body || {}
        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Mot de passe actuel et nouveau mot de passe requis' },
                { status: 400 }
            )
        }
        if (typeof newPassword !== 'string' || newPassword.length < 6) {
            return NextResponse.json(
                { error: 'Le nouveau mot de passe doit contenir au moins 6 caractères' },
                { status: 400 }
            )
        }
        if (newPassword === currentPassword) {
            return NextResponse.json(
                { error: 'Le nouveau mot de passe doit être différent de l\'actuel' },
                { status: 400 }
            )
        }

        const [user] = await db
            .select({ id: users.id, passwordHash: users.passwordHash })
            .from(users)
            .where(eq(users.id, session.userId))

        if (!user) {
            return NextResponse.json({ error: 'Utilisateur introuvable' }, { status: 404 })
        }

        if (!verifyPassword(currentPassword, user.passwordHash)) {
            return NextResponse.json({ error: 'Mot de passe actuel incorrect' }, { status: 400 })
        }

        await db
            .update(users)
            .set({ passwordHash: hashPassword(newPassword) })
            .where(eq(users.id, user.id))

        // Invalidate all other sessions for security
        await db
            .delete(sessions)
            .where(and(eq(sessions.userId, user.id), ne(sessions.token, token)))

        return NextResponse.json({ success: true, message: 'Mot de passe modifié avec succès' })
    } catch (err) {
        console.error('[/api/auth/change-password]', err)
        return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
    }
}
