import { NextResponse } from "next/server"
import { db } from "@/db"
import { users } from "@/db/schema"
import { eq, and } from "drizzle-orm"

export async function GET() {
    try {
        const cashiers = await db.query.users.findMany({
            where: and(
                eq(users.role, "cashier"),
                eq(users.isActive, true)
            ),
            columns: {
                id: true,
                fullName: true,
                username: true,
            }
        })

        return NextResponse.json({ data: cashiers })
    } catch (error: any) {
        console.error("Failed to fetch cashiers:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
