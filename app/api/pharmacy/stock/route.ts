import { NextResponse } from "next/server"
import { db } from "@/db"
import { medicines, medicineLots, medicineCategories } from "@/db/schema"
import { and, eq, gt, sql } from "drizzle-orm"

export async function GET() {
    try {
        // Fetch medicines with their lots and categories
        const results = await db.query.medicines.findMany({
            where: eq(medicines.isActive, true),
            with: {
                category: true,
                lots: {
                    where: gt(medicineLots.quantityRemaining, "0"),
                    orderBy: (lots, { asc }) => [asc(lots.expiryDate)]
                }
            }
        })

        // Transform into the format expected by the frontend
        const stockData = results.map(med => {
            const totalAvailable = med.lots.reduce((sum, lot) => sum + parseFloat(lot.quantityRemaining), 0)
            return {
                id: med.id,
                name: med.name,
                genericName: med.genericName,
                unit: med.unit,
                sellingPrice: med.sellingPrice,
                categoryName: med.category?.name || "Non classé",
                totalAvailable: totalAvailable.toString(),
                lots: med.lots
            }
        })

        return NextResponse.json({ data: stockData })
    } catch (error) {
        console.error("Failed to fetch stock data:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
