import { NextResponse } from 'next/server'
import { db } from '@/db'
import { pharmacySales, pharmacyStock, medicineLots, medicines, purchaseOrders, suppliers } from '@/db/schema'
import { eq, and, gte, lte, sql, asc, desc } from 'drizzle-orm'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const startDate = searchParams.get('startDate') || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()
        const endDate = searchParams.get('endDate') || new Date().toISOString()

        const start = new Date(startDate)
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)

        // 1. Sales Summary
        const salesSummary = await db.select({
            totalRevenue: sql<number>`COALESCE(SUM(${pharmacySales.totalAmount}), 0)`,
            totalSales: sql<number>`COUNT(*)`,
        })
            .from(pharmacySales)
            .where(
                and(
                    gte(pharmacySales.saleDate, start),
                    lte(pharmacySales.saleDate, end),
                    eq(pharmacySales.status, 'confirmed')
                )
            )

        // 2. Stock Valuation
        const stockValuation = await db.select({
            totalValue: sql<number>`COALESCE(SUM(${medicineLots.quantityRemaining} * ${medicineLots.unitCost}), 0)`,
        })
            .from(medicineLots)

        // 3. Low Stock Count
        const lowStock = await db.select({
            count: sql<number>`COUNT(*)`,
        })
            .from(pharmacyStock)
            .where(sql`${pharmacyStock.quantity} < 10`)

        // 4. Trending Medicines
        const trendingMedicines = await db.execute(sql`
            SELECT m.name, SUM(psi.quantity) as total_sold
            FROM pharmacy_sale_items psi
            JOIN medicines m ON psi.medicine_id = m.id
            JOIN pharmacy_sales ps ON psi.sale_id = ps.id
            WHERE ps.sale_date >= ${start.toISOString()} AND ps.sale_date <= ${end.toISOString()}
            GROUP BY m.name
            ORDER BY total_sold DESC
            LIMIT 5
        `)

        // 5. Recent Sales Details
        const recentSales = await db.query.pharmacySales.findMany({
            where: and(
                gte(pharmacySales.saleDate, start),
                lte(pharmacySales.saleDate, end)
            ),
            orderBy: desc(pharmacySales.saleDate),
            limit: 50
        })

        // 6. Purchases Summary
        const purchasesSummary = await db.select({
            totalPurchases: sql<number>`COALESCE(SUM(${purchaseOrders.totalAmount}), 0)`,
            orderCount: sql<number>`COUNT(*)`,
        })
            .from(purchaseOrders)
            .where(
                and(
                    gte(purchaseOrders.orderDate, start),
                    lte(purchaseOrders.orderDate, end)
                )
            )

        // 7. Recent Purchases with Supplier
        const recentPurchases = await db.query.purchaseOrders.findMany({
            where: and(
                gte(purchaseOrders.orderDate, start),
                lte(purchaseOrders.orderDate, end)
            ),
            with: {
                supplier: true
            },
            orderBy: desc(purchaseOrders.orderDate),
            limit: 50
        })

        return NextResponse.json({
            success: true,
            summary: {
                revenue: salesSummary[0]?.totalRevenue || 0,
                salesCount: salesSummary[0]?.totalSales || 0,
                stockValue: stockValuation[0]?.totalValue || 0,
                lowStockCount: lowStock[0]?.count || 0,
                purchaseTotal: purchasesSummary[0]?.totalPurchases || 0,
                purchaseCount: purchasesSummary[0]?.orderCount || 0
            },
            trending: trendingMedicines,
            data: {
                sales: recentSales,
                purchases: recentPurchases
            }
        })
    } catch (error) {
        console.error('Pharmacy Report Error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
