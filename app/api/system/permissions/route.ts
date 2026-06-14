import { NextResponse } from "next/server"
import { db } from "@/db"
import { menuPermissions } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET() {
    try {
        const data = await db.query.menuPermissions.findMany()
        return NextResponse.json({ data })
    } catch (error: any) {
        return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { group, roles } = body

        if (!group) return NextResponse.json({ error: "Group is required" }, { status: 400 })

        // Check if exists
        const existing = await db.query.menuPermissions.findFirst({
            where: eq(menuPermissions.group, group)
        })

        if (existing) {
            await db.update(menuPermissions)
                .set({ roles, updatedAt: new Date() })
                .where(eq(menuPermissions.group, group))
        } else {
            await db.insert(menuPermissions)
                .values({ group, roles })
        }

        return NextResponse.json({ message: "Permissions updated successfully" })
    } catch (error: any) {
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}
