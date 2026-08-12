import { db } from "@/db"
import { cashSessions } from "@/db/schema"
import { and, eq } from "drizzle-orm"

export async function getOpenSessionForUser(userId: string) {
    return db.query.cashSessions.findFirst({
        where: and(eq(cashSessions.openedBy, userId), eq(cashSessions.status, "open")),
    })
}

export const NO_OPEN_SESSION_ERROR =
    "Aucune session de caisse ouverte. Veuillez ouvrir une session avant d'encaisser."
