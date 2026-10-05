import { NextResponse } from 'next/server'
import { db } from '@/db'
import {
    invoices,
    patients,
    payments,
    invoiceItems,
    medicalActs,
    services,
    expenses,
} from '@/db/schema'
import { eq, and, gte, lte, desc, sql, getTableName } from 'drizzle-orm'

const num = (v: unknown) => {
    const n = parseFloat(String(v ?? 0))
    return Number.isFinite(n) ? n : 0
}

/**
 * Most recent payment method for an invoice.
 *
 * The correlated column must be table-qualified: Drizzle renders `${invoices.id}`
 * as a bare `"id"` inside a select-list subquery, which silently binds to
 * `payments.id` instead of the outer invoice.
 */
const latestPaymentMethod = sql<string>`(
    select payment_method
    from ${payments}
    where invoice_id = ${sql.identifier(getTableName(invoices))}.id
    order by created_at desc
    limit 1
)`

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const status = searchParams.get('status')
        const paymentMethod = searchParams.get('paymentMethod')
        const patientId = searchParams.get('patientId')
        const serviceId = searchParams.get('serviceId')

        // ── Invoice-level filters ────────────────────────────────────────────
        // Every filter lives in the WHERE clause so the detail rows and the
        // per-service aggregates are always computed from the same set.
        const filters = []

        if (startDate) {
            filters.push(gte(invoices.createdAt, new Date(startDate)))
        }
        if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            filters.push(lte(invoices.createdAt, end))
        }
        if (status && status !== 'all') {
            filters.push(eq(invoices.status, status))
        }
        if (patientId) {
            filters.push(eq(invoices.patientId, patientId))
        }
        if (serviceId) {
            filters.push(sql`exists (
                select 1
                from ${invoiceItems} fii
                inner join ${medicalActs} fma on fma.id = fii.medical_act_id
                where fii.invoice_id = ${invoices.id}
                  and fma.service_id = ${serviceId}
            )`)
        }
        if (paymentMethod && paymentMethod !== 'all') {
            filters.push(sql`(${latestPaymentMethod}) = ${paymentMethod}`)
        }

        const where = and(...filters)

        // ── Invoice detail list ──────────────────────────────────────────────
        const data = await db
            .select({
                id: invoices.id,
                invoiceNumber: invoices.invoiceNumber,
                totalAmount: invoices.totalAmount,
                insuranceAmount: invoices.insuranceAmount,
                patientAmount: invoices.patientAmount,
                discountAmount: invoices.discountAmount,
                status: invoices.status,
                createdAt: invoices.createdAt,
                patient: {
                    id: patients.id,
                    firstName: patients.firstName,
                    lastName: patients.lastName,
                },
                paymentMethod: latestPaymentMethod,
            })
            .from(invoices)
            .innerJoin(patients, eq(invoices.patientId, patients.id))
            .where(where)
            .orderBy(desc(invoices.createdAt))

        // ── Revenue aggregated by service ────────────────────────────────────
        // Discount / patient / insurance splits are invoice-level, so they are
        // prorated onto each line. That keeps the per-service figures additive
        // and equal to the invoice totals.
        const patientShare = sql`(
            ${invoiceItems.totalPrice}
            * ${invoices.patientAmount}
            / nullif(${invoices.totalAmount}, 0)
        )`

        const rows = await db
            .select({
                serviceId: services.id,
                serviceName: services.name,
                serviceCode: services.code,
                actCount: sql<number>`count(distinct ${medicalActs.id})::int`,
                lineCount: sql<number>`count(${invoiceItems.id})::int`,
                quantity: sql<string>`coalesce(sum(${invoiceItems.quantity}), 0)`,
                gross: sql<string>`coalesce(sum(${invoiceItems.totalPrice}), 0)`,
                discount: sql<string>`coalesce(sum(
                    ${invoiceItems.totalPrice}
                    * ${invoices.discountAmount}
                    / nullif(${invoices.totalAmount}, 0)
                ), 0)`,
                patient: sql<string>`coalesce(sum(${patientShare}), 0)`,
                insurance: sql<string>`coalesce(sum(
                    ${invoiceItems.totalPrice}
                    * ${invoices.insuranceAmount}
                    / nullif(${invoices.totalAmount}, 0)
                ), 0)`,
                collected: sql<string>`coalesce(sum(
                    case when ${invoices.status} = 'paid' then ${patientShare} else 0 end
                ), 0)`,
                pending: sql<string>`coalesce(sum(
                    case when ${invoices.status} = 'pending' then ${patientShare} else 0 end
                ), 0)`,
            })
            .from(invoiceItems)
            .innerJoin(invoices, eq(invoiceItems.invoiceId, invoices.id))
            .innerJoin(medicalActs, eq(invoiceItems.medicalActId, medicalActs.id))
            .innerJoin(services, eq(medicalActs.serviceId, services.id))
            .where(serviceId ? and(where, eq(services.id, serviceId)) : where)
            .groupBy(services.id, services.name, services.code)
            .orderBy(desc(sql`coalesce(sum(${invoiceItems.totalPrice}), 0)`))

        const totals = rows.reduce(
            (acc, r) => {
                acc.gross += num(r.gross)
                acc.discount += num(r.discount)
                acc.patient += num(r.patient)
                acc.insurance += num(r.insurance)
                acc.collected += num(r.collected)
                acc.pending += num(r.pending)
                return acc
            },
            { gross: 0, discount: 0, patient: 0, insurance: 0, collected: 0, pending: 0 }
        )

        const byService = rows.map((r) => {
            const gross = num(r.gross)
            const discount = num(r.discount)
            return {
                serviceId: r.serviceId,
                serviceName: r.serviceName,
                serviceCode: r.serviceCode,
                actCount: r.actCount,
                lineCount: r.lineCount,
                quantity: num(r.quantity),
                gross,
                discount,
                net: gross - discount,
                patient: num(r.patient),
                insurance: num(r.insurance),
                collected: num(r.collected),
                pending: num(r.pending),
                share: totals.gross > 0 ? (gross / totals.gross) * 100 : 0,
            }
        })

        // ── Period expenses ──────────────────────────────────────────────────
        // Expenses are not tied to a service in the schema, so they are reported
        // as a single figure for the selected period.
        const expenseFilters = []
        if (startDate) expenseFilters.push(gte(expenses.createdAt, new Date(startDate)))
        if (endDate) {
            const end = new Date(endDate)
            end.setHours(23, 59, 59, 999)
            expenseFilters.push(lte(expenses.createdAt, end))
        }

        const expenseRows = await db
            .select({
                category: expenses.category,
                amount: sql<string>`coalesce(sum(${expenses.amount}), 0)`,
                count: sql<number>`count(${expenses.id})::int`,
            })
            .from(expenses)
            .where(and(...expenseFilters))
            .groupBy(expenses.category)
            .orderBy(desc(sql`coalesce(sum(${expenses.amount}), 0)`))

        const expenseBreakdown = expenseRows.map((e) => ({
            category: e.category,
            amount: num(e.amount),
            count: e.count,
        }))
        const totalExpenses = expenseBreakdown.reduce((acc, e) => acc + e.amount, 0)

        // ── Summary ──────────────────────────────────────────────────────────
        const netRevenue = totals.gross - totals.discount
        const profit = netRevenue - totalExpenses

        return NextResponse.json({
            success: true,
            data,
            byService,
            expenses: expenseBreakdown,
            summary: {
                totalBrut: totals.gross,
                totalDiscount: totals.discount,
                netRevenue,
                totalPatient: totals.patient,
                totalInsurance: totals.insurance,
                collected: totals.collected,
                pending: totals.pending,
                count: data.length,
                totalExpenses,
                profit,
                margin: netRevenue > 0 ? (profit / netRevenue) * 100 : 0,
                serviceCount: byService.length,
                filteredService: !!serviceId,
            },
        })
    } catch (error) {
        console.error('Report API Error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}