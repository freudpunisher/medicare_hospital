import { NextResponse } from 'next/server'
import { db } from '@/db'
import { pharmacySales, pharmacyStock, medicineLots, medicines } from '@/db/schema'
import { eq, and, gte, lte, sql, asc, desc } from 'drizzle-orm'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const startDate = searchParams.get('startDate') || new Date(new Date().setDate(new Date().getDate() - 30)).toISOString()
        const endDate = searchParams.get('endDate') || new Date().toISOString()

        // 1. Sales Summary
        const salesSummary = await db.select({
            totalRevenue: sql<number>`COALESCE(SUM(${pharmacySales.totalAmount}), 0)`,
            totalSales: sql<number>`COUNT(*)`,
        })
            .from(pharmacySales)
            .where(
                and(
                    gte(pharmacySales.saleDate, new Date(startDate)),
                    lte(pharmacySales.saleDate, new Date(endDate)),
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

        // 4. Trending Medicines (Top Items by Sale Quantity)
        const trendingMedicines = await db.execute(sql`
            SELECT m.name, SUM(psi.quantity) as total_sold
            FROM pharmacy_sale_items psi
            JOIN medicines m ON psi.medicine_id = m.id
            JOIN pharmacy_sales ps ON psi.sale_id = ps.id
            WHERE ps.sale_date >= ${new Date(startDate)} AND ps.sale_date <= ${new Date(endDate)}
            GROUP BY m.name
            ORDER BY total_sold DESC
            LIMIT 5
        `)

        // 5. Recent Sales Details
        const recentSales = await db.query.pharmacySales.findMany({
            where: and(
                gte(pharmacySales.saleDate, new Date(startDate)),
                lte(pharmacySales.saleDate, new Date(endDate))
            ),
            orderBy: desc(pharmacySales.saleDate),
            limit: 50
        })

        return NextResponse.json({
            success: true,
            summary: {
                revenue: salesSummary[0]?.totalRevenue || 0,
                salesCount: salesSummary[0]?.totalSales || 0,
                stockValue: stockValuation[0]?.totalValue || 0,
                lowStockCount: lowStock[0]?.count || 0
            },
            trending: trendingMedicines,
            data: recentSales
        })
    } catch (error) {
        console.error('Pharmacy Report Error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
