import { NextResponse } from 'next/server'
import { db } from '@/db'
import {
    patients,
    users,
    medicalActs,
    services,
    invoices,
    payments,
    pharmacySales,
    medicineLots,
    invoiceItems
} from '@/db/schema'
import { eq, sql, and, gte, lte, desc } from 'drizzle-orm'
import { startOfMonth, subMonths, format } from 'date-fns'

export async function GET() {
    try {
        // 1. Basic Counts
        const [patientCount] = await db.select({ count: sql<number>`count(*)` }).from(patients)
        const [doctorCount] = await db.select({ count: sql<number>`count(*)` }).from(users).where(and(eq(users.role, 'doctor'), eq(users.isActive, true)))
        const [actCount] = await db.select({ count: sql<number>`count(*)` }).from(medicalActs).where(eq(medicalActs.isActive, true))
        const [serviceCount] = await db.select({ count: sql<number>`count(*)` }).from(services).where(eq(services.isActive, true))
        const [invoiceCount] = await db.select({ count: sql<number>`count(*)` }).from(invoices)

        // 2. Financial Summary
        // Total Billing Income (Payments received)
        const [billingIncome] = await db.select({
            total: sql<number>`coalesce(sum(amount), 0)`
        }).from(payments)

        // Total Pharmacy Income
        const [pharmacyIncome] = await db.select({
            total: sql<number>`coalesce(sum(total_amount), 0)`
        }).from(pharmacySales).where(eq(pharmacySales.paymentStatus, 'paid'))

        // Money Owed (Debt)
        // We calculate this as (Patient + Insurance amounts on invoices) - (Sum of payments)
        const [totalBilled] = await db.select({
            total: sql<number>`coalesce(sum(total_amount), 0)`
        }).from(invoices)

        const moneyOwed = Math.max(0, Number(totalBilled.total) - Number(billingIncome.total))

        // 3. Expiring Medicines (within 3 months)
        const threeMonthsFromNow = new Date()
        threeMonthsFromNow.setMonth(threeMonthsFromNow.getMonth() + 3)

        const [expiringMedicinesCount] = await db.select({
            count: sql<number>`count(*)`
        }).from(medicineLots)
            .where(and(
                gte(medicineLots.quantityRemaining, sql`0`),
                lte(medicineLots.expiryDate, threeMonthsFromNow)
            ))

        // 4. Most Used Acts
        const popularActs = await db.select({
            id: medicalActs.id,
            name: medicalActs.name,
            usageCount: sql<number>`count(${invoiceItems.id})`
        })
            .from(medicalActs)
            .leftJoin(invoiceItems, eq(medicalActs.id, invoiceItems.medicalActId))
            .groupBy(medicalActs.id)
            .orderBy(desc(sql`count(${invoiceItems.id})`))
            .limit(5)

        // 5. Recent Invoices
        const recentInvoices = await db.query.invoices.findMany({
            limit: 5,
            orderBy: [desc(invoices.createdAt)],
            with: {
                patient: true
            }
        })

        // 6. Monthly Revenue (Last 6 months)
        // For simplicity, we'll aggregate pharmacy sales + billing payments
        const monthlyData = []
        for (let i = 5; i >= 0; i--) {
            const monthDate = subMonths(new Date(), i)
            const monthStart = startOfMonth(monthDate)
            const nextMonth = startOfMonth(subMonths(monthDate, -1))

            const [pIncome] = await db.select({ total: sql<number>`coalesce(sum(total_amount), 0)` })
                .from(pharmacySales)
                .where(and(gte(pharmacySales.saleDate, monthStart), lte(pharmacySales.saleDate, nextMonth)))

            const [bIncome] = await db.select({ total: sql<number>`coalesce(sum(amount), 0)` })
                .from(payments)
                .where(and(gte(payments.createdAt, monthStart), lte(payments.createdAt, nextMonth)))

            monthlyData.push({
                month: format(monthDate, 'MMM'),
                revenue: Number(pIncome.total) + Number(bIncome.total)
            })
        }

        return NextResponse.json({
            kpis: [
                { title: "Total Patients", value: patientCount.count, trend: "neutral", change: "Live" },
                { title: "Active Doctors", value: doctorCount.count, trend: "neutral", change: "Live" },
                { title: "Active Acts", value: actCount.count, trend: "neutral", change: "Live" },
                { title: "Active Services", value: serviceCount.count, trend: "neutral", change: "Live" },
                { title: "Total Invoices", value: invoiceCount.count, trend: "neutral", change: "Live" },
            ],
            financials: {
                totalIncome: Number(billingIncome.total) + Number(pharmacyIncome.total),
                moneyOwed: moneyOwed,
                expiringCount: expiringMedicinesCount.count,
                netResult: (Number(billingIncome.total) + Number(pharmacyIncome.total)) // Simplified net
            },
            popularActs,
            recentInvoices,
            monthlyRevenue: monthlyData,
            invoiceStatus: [
                { name: "Paid", value: (await db.select({ c: sql`count(*)` }).from(invoices).where(eq(invoices.status, 'paid')))[0].c },
                { name: "Partial", value: (await db.select({ c: sql`count(*)` }).from(invoices).where(eq(invoices.status, 'partial')))[0].c },
                { name: "Pending", value: (await db.select({ c: sql`count(*)` }).from(invoices).where(eq(invoices.status, 'pending')))[0].c }
            ]
        })
    } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
        return NextResponse.json({ error: 'Failed to fetch dashboard stats' }, { status: 500 })
    }
}
