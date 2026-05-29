import { NextResponse } from 'next/server'
import { db } from '@/db'
import { invoices, patients, payments } from '@/db/schema'
import { eq, desc, sql } from 'drizzle-orm'

export async function GET() {
    try {
        const list = await db.select({
            id: invoices.id,
            invoiceNumber: invoices.invoiceNumber,
            totalAmount: invoices.totalAmount,
            insuranceAmount: invoices.insuranceAmount,
            patientAmount: invoices.patientAmount,
            status: invoices.status,
            createdAt: invoices.createdAt,
            patient: {
                id: patients.id,
                firstName: patients.firstName,
                lastName: patients.lastName,
                gender: patients.gender
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
            .orderBy(desc(invoices.createdAt))

        return NextResponse.json({
            success: true,
            data: list
        })
    } catch (error) {
        console.error('Failed to fetch invoices:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch invoices'
        }, { status: 500 })
    }
}
