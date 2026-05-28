import { NextResponse } from "next/server"
import { db } from "@/db"
import { medicines, medicineLots } from "@/db/schema"
import { and, eq, gt, asc } from "drizzle-orm"

export async function GET() {
    try {
        // Fetch active medicines with valid stock lots
        const data = await db.query.medicines.findMany({
            where: eq(medicines.isActive, true),
            with: {
                lots: {
                    where: and(
                        gt(medicineLots.quantityRemaining, "0"),
                        gt(medicineLots.expiryDate, new Date())
                    ),
                    orderBy: asc(medicineLots.expiryDate)
                }
            }
        })

        // Filter and format response
        const availableItems = data
            .filter(m => m.lots.length > 0)
            .map(m => {
                const totalQty = m.lots.reduce((sum, lot) => sum + parseFloat(lot.quantityRemaining), 0)
                return {
                    id: m.id,
                    name: m.name,
                    genericName: m.genericName,
                    sellingPrice: m.sellingPrice,
                    unit: m.unit,
                    totalAvailable: totalQty.toString(),
                    lots: m.lots // Needed for FEFO preview in UI
                }
            })

        return NextResponse.json({ data: availableItems })
    } catch (error) {
        console.error("Failed to fetch available medicines:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
