import { NextResponse } from "next/server"
import { db } from "@/db"
import { stockMovements } from "@/db/schema"
import { desc } from "drizzle-orm"

export async function GET() {
    try {
        const data = await db.query.stockMovements.findMany({
            orderBy: desc(stockMovements.createdAt),
            with: {
                medicine: true
            }
        })

        return NextResponse.json({ data })
    } catch (error) {
        console.error("Failed to fetch stock movements:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
