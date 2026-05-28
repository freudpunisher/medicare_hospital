import { NextResponse } from "next/server"
import { db } from "@/db"
import { pharmacySales, pharmacySaleItems, stockMovements, medicines } from "@/db/schema"
import { consumeStockFEFO } from "@/lib/pharmacy/stock"
import { z } from "zod"
import { desc, eq } from "drizzle-orm"

const saleBodySchema = z.object({
    customerName: z.string().nullable().optional(),
    items: z.array(z.object({
        medicineId: z.string().uuid(),
        quantity: z.number().positive(),
    })).min(1),
    notes: z.string().optional(),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { customerName, items, notes } = saleBodySchema.parse(body)

        const result = await db.transaction(async (tx) => {
            let subtotal = 0
            const saleItemsToCreate = []
            const movementsToCreate = []

            for (const item of items) {
                // Fetch medicine for price
                const medicine = await tx.query.medicines.findFirst({
                    where: eq(medicines.id, item.medicineId)
                })

                if (!medicine) throw new Error(`Medicine not found: ${item.medicineId}`)
                const unitPrice = parseFloat(medicine.sellingPrice)

                // Consume stock using FEFO
                const consumedLots = await consumeStockFEFO(item.medicineId, item.quantity, tx)

                for (const lot of consumedLots) {
                    const itemTotal = lot.quantityConsumed * unitPrice
                    subtotal += itemTotal

                    saleItemsToCreate.push({
                        medicineId: item.medicineId,
                        lotId: lot.lotId,
                        quantity: lot.quantityConsumed.toString(),
                        unitPrice: unitPrice.toString(),
                        totalPrice: itemTotal.toString(),
                    })

                    movementsToCreate.push({
                        medicineId: item.medicineId,
                        type: "sale",
                        quantity: (-lot.quantityConsumed).toString(),
                        referenceType: "pharmacy_sale",
                    })
                }
            }

            // Create Sale Record
            const [newSale] = await tx.insert(pharmacySales).values({
                customerName: customerName || "Anonymous",
                subtotal: subtotal.toString(),
                totalAmount: subtotal.toString(),
                notes,
                status: "confirmed",
                paymentMethod: "cash",
                paymentStatus: "paid",
            }).returning()

            // Create Sale Items and Link Movements
            await tx.insert(pharmacySaleItems).values(
                saleItemsToCreate.map(si => ({ ...si, saleId: newSale.id }))
            )

            await tx.insert(stockMovements).values(
                movementsToCreate.map(sm => ({ ...sm, referenceId: newSale.id }))
            )

            return newSale
        })

        return NextResponse.json({ data: result })
    } catch (error: any) {
        console.error("Sale creation failed:", error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}

export async function GET() {
    try {
        const salesList = await db.query.pharmacySales.findMany({
            orderBy: desc(pharmacySales.saleDate),
            with: {
                items: true
            }
        })

        // Map to include item count as requested
        const formattedSales = salesList.map(s => ({
            ...s,
            itemCount: s.items.length
        }))

        return NextResponse.json({ data: formattedSales })
    } catch (error) {
        console.error("Failed to fetch sales list:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
