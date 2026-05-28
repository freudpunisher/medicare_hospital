import { NextResponse } from "next/server"
import { db } from "@/db"
import { purchaseOrders, purchaseOrderItems, medicineLots, stockMovements } from "@/db/schema"
import { z } from "zod"
import { desc } from "drizzle-orm"

const purchaseBodySchema = z.object({
    supplierId: z.string().uuid(),
    orderDate: z.string().optional(),
    notes: z.string().optional(),
    items: z.array(z.object({
        medicineId: z.string().uuid(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive(),
        lotNumber: z.string(),
        expiryDate: z.string(),
    })).min(1),
})

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { supplierId, orderDate, notes, items } = purchaseBodySchema.parse(body)

        const result = await db.transaction(async (tx) => {
            // 1. Calculate total amount
            const totalAmount = items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0)

            // 2. Create Purchase Order
            const [newOrder] = await tx.insert(purchaseOrders).values({
                supplierId,
                orderDate: orderDate ? new Date(orderDate) : new Date(),
                status: "completed",
                totalAmount: totalAmount.toString(),
            }).returning()

            // 3. Process each item
            for (const item of items) {
                // Create PO Item
                const [poItem] = await tx.insert(purchaseOrderItems).values({
                    purchaseOrderId: newOrder.id,
                    medicineId: item.medicineId,
                    quantity: item.quantity.toString(),
                    unitPrice: item.unitPrice.toString(),
                }).returning()

                // Create Medicine Lot
                await tx.insert(medicineLots).values({
                    medicineId: item.medicineId,
                    purchaseOrderItemId: poItem.id,
                    lotNumber: item.lotNumber,
                    quantityReceived: item.quantity.toString(),
                    quantityRemaining: item.quantity.toString(),
                    unitCost: item.unitPrice.toString(),
                    expiryDate: new Date(item.expiryDate),
                    receivedAt: new Date(),
                })

                // Record Stock Movement
                await tx.insert(stockMovements).values({
                    medicineId: item.medicineId,
                    type: "purchase",
                    quantity: item.quantity.toString(),
                    referenceId: newOrder.id,
                    referenceType: "purchase_order",
                })
            }

            return newOrder
        })

        return NextResponse.json({ data: result })
    } catch (error: any) {
        console.error("Purchase creation failed:", error)
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 })
        }
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
    }
}

export async function GET() {
    try {
        const data = await db.query.purchaseOrders.findMany({
            orderBy: desc(purchaseOrders.orderDate),
            with: {
                supplier: true,
                items: {
                    with: {
                        medicine: true
                    }
                }
            }
        })

        return NextResponse.json({ data })
    } catch (error) {
        console.error("Failed to fetch purchases:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
