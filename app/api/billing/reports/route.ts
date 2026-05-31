import { NextResponse } from 'next/server'
import { db } from '@/db'
import { invoices, patients, payments } from '@/db/schema'
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const startDate = searchParams.get('startDate')
        const endDate = searchParams.get('endDate')
        const status = searchParams.get('status')
        const paymentMethod = searchParams.get('paymentMethod')
        const patientId = searchParams.get('patientId')

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

        // We use a subquery to filter by payment method since it's in a different table
        // or we can join but since an invoice can have multiple payments (partial), 
        // usually we report on the invoice overall.

        let query = db.select({
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
            paymentMethod: sql<string>`(
                select payment_method 
                from ${payments} 
                where invoice_id = ${invoices.id} 
                order by created_at desc 
                limit 1
            )`
        })
            .from(invoices)
            .innerJoin(patients, eq(invoices.patientId, patients.id))
            .where(and(...filters))
            .orderBy(desc(invoices.createdAt))

        const results = await query

        // Post-filter for paymentMethod if requested
        let filteredResults = results
        if (paymentMethod && paymentMethod !== 'all') {
            filteredResults = results.filter(r => r.paymentMethod === paymentMethod)
        }

        // Calculate summaries
        const summary = filteredResults.reduce((acc, curr) => {
            const total = parseFloat(curr.totalAmount.toString())
            const patient = parseFloat(curr.patientAmount.toString())
            const insurance = parseFloat(curr.insuranceAmount.toString())

            acc.totalBrut += total
            acc.totalPatient += patient
            acc.totalInsurance += insurance

            if (curr.status === 'paid') acc.collected += patient
            else if (curr.status === 'pending') acc.pending += patient

            return acc
        }, {
            totalBrut: 0,
            totalPatient: 0,
            totalInsurance: 0,
            collected: 0,
            pending: 0,
            count: filteredResults.length
        })

        return NextResponse.json({
            success: true,
            data: filteredResults,
            summary
        })
    } catch (error) {
        console.error('Report API Error:', error)
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 })
    }
}
