import { medicineLots } from "@/db/schema"
import { and, asc, eq, gt } from "drizzle-orm"

/**
 * Consumes medicine stock using FEFO (First Expired First Out) logic.
 * MUST be called within a Drizzle transaction.
 */
export async function consumeStockFEFO(
    medicineId: string,
    quantityNeeded: number,
    tx: any // Drizzle Transaction
) {
    // 1. Query available lots ordered by expiry date (First Expired First Out)
    const availableLots = await tx.query.medicineLots.findMany({
        where: and(
            eq(medicineLots.medicineId, medicineId),
            gt(medicineLots.quantityRemaining, "0"),
            gt(medicineLots.expiryDate, new Date())
        ),
        orderBy: asc(medicineLots.expiryDate)
    })

    // 2. Check total availability across all valid lots
    const totalAvailable = availableLots.reduce((sum: number, lot: any) => sum + parseFloat(lot.quantityRemaining), 0)
    if (totalAvailable < quantityNeeded) {
        throw new Error(`Stock insuffisant. Requis: ${quantityNeeded}, Disponible: ${totalAvailable}`)
    }

    // 3. Consume lots sequentially
    let remainingToConsume = quantityNeeded
    const consumedLots = []

    for (const lot of availableLots) {
        if (remainingToConsume <= 0) break

        const lotQty = parseFloat(lot.quantityRemaining)
        const toTake = Math.min(lotQty, remainingToConsume)

        // Update lot quantity remaining
        await tx.update(medicineLots)
            .set({
                quantityRemaining: (lotQty - toTake).toFixed(2)
            })
            .where(eq(medicineLots.id, lot.id))

        consumedLots.push({
            lotId: lot.id,
            lotNumber: lot.lotNumber,
            quantityConsumed: toTake
        })

        remainingToConsume -= toTake
    }

    return consumedLots
}
