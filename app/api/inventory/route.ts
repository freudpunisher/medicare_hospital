import { NextResponse } from "next/server"
import { db } from "@/db"
import { medicines, medicineLots, medicineCategories, suppliers, stockMovements } from "@/db/schema"
import { and, eq, gt, gte, lt, sql, desc, count } from "drizzle-orm"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const search = (searchParams.get("search") || "").trim()
    const categoryId = searchParams.get("categoryId") || ""

    const whereClauses = [eq(medicines.isActive, true)]
    if (search) {
      whereClauses.push(
        sql`(${medicines.name} ILIKE ${`%${search}%`} OR ${medicines.genericName} ILIKE ${`%${search}%`} OR ${medicines.barcode} ILIKE ${`%${search}%`})`
      )
    }
    if (categoryId) {
      whereClauses.push(eq(medicines.categoryId, categoryId))
    }

    const [items, categories, totalCount, lowStockCount, expiredCount, totalValueResult, recentMovements] = await Promise.all([
      db.query.medicines.findMany({
        where: and(...whereClauses),
        orderBy: desc(medicines.createdAt),
        with: {
          category: true,
          lots: {
            where: gte(medicineLots.quantityRemaining, "0"),
            orderBy: (lots, { asc }) => [asc(lots.expiryDate)],
          },
        },
      }),

      db.query.medicineCategories.findMany({
        orderBy: (cats, { asc }) => [asc(cats.name)],
      }),

      db.select({ count: count() }).from(medicines).where(eq(medicines.isActive, true)),

      db.select({ count: count() })
        .from(medicines)
        .where(
          and(
            eq(medicines.isActive, true),
            sql`(SELECT COALESCE(SUM(CAST(quantity_remaining AS NUMERIC)), 0) FROM medicine_lots WHERE medicine_id = ${medicines.id}) < 10`
          )
        ),

      db.select({ count: count() })
        .from(medicineLots)
        .where(and(gt(medicineLots.quantityRemaining, "0"), lt(medicineLots.expiryDate, sql`NOW() + INTERVAL '3 months'`))),

      db.select({
        total: sql`COALESCE(SUM(
          (SELECT COALESCE(SUM(CAST(quantity_remaining AS NUMERIC)), 0) FROM medicine_lots WHERE medicine_id = ${medicines.id})
          * CAST(${medicines.sellingPrice} AS NUMERIC)
        ), 0)`,
      }).from(medicines).where(eq(medicines.isActive, true)),

      db.query.stockMovements.findMany({
        orderBy: desc(stockMovements.createdAt),
        limit: 10,
        with: { medicine: true },
      }),
    ])

    const inventoryData = items.map((med) => {
      const totalAvailable = med.lots.reduce((sum, lot) => sum + parseFloat(lot.quantityRemaining || "0"), 0)
      const activeLots = med.lots.filter((l) => parseFloat(l.quantityRemaining) > 0)
      const nearExpiryLots = activeLots.filter(
        (l) => new Date(l.expiryDate) < new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
      )
      return {
        id: med.id,
        name: med.name,
        genericName: med.genericName,
        unit: med.unit,
        barcode: med.barcode,
        sellingPrice: med.sellingPrice,
        categoryName: med.category?.name || "Non classé",
        categoryId: med.categoryId,
        totalAvailable,
        lots: activeLots.map((l) => ({
          id: l.id,
          lotNumber: l.lotNumber,
          quantityRemaining: l.quantityRemaining,
          expiryDate: l.expiryDate,
          unitCost: l.unitCost,
        })),
        nearExpiryCount: nearExpiryLots.length,
        stockValue: totalAvailable * parseFloat(med.sellingPrice || "0"),
      }
    })

    const totalValue = parseFloat(totalValueResult[0]?.total as string || "0")

    return NextResponse.json({
      data: inventoryData,
      categories,
      stats: {
        totalProducts: Number(totalCount[0]?.count || 0),
        lowStock: Number(lowStockCount[0]?.count || 0),
        nearExpiry: Number(expiredCount[0]?.count || 0),
        totalValue,
      },
      recentMovements: recentMovements.map((m) => ({
        id: m.id,
        type: m.type,
        quantity: m.quantity,
        medicineName: m.medicine?.name || "Inconnu",
        createdAt: m.createdAt,
      })),
    })
  } catch (error) {
    console.error("Failed to fetch inventory data:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
