import { NextResponse } from 'next/server'
import { db } from '@/db'
import { invoices, patients, invoiceItems, medicalActs } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: invoiceId } = await params

        // Fetch invoice with patient
        const invoice = await db.query.invoices.findFirst({
            where: eq(invoices.id, invoiceId),
            with: {
                patient: true,
            }
        })

        if (!invoice) {
            return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 })
        }

        // Fetch invoice items with medical acts
        const items = await db.select({
            id: invoiceItems.id,
            quantity: invoiceItems.quantity,
            unitPrice: invoiceItems.unitPrice,
            totalPrice: invoiceItems.totalPrice,
            medicalAct: {
                code: medicalActs.code,
                name: medicalActs.name,
            }
        })
            .from(invoiceItems)
            .innerJoin(medicalActs, eq(invoiceItems.medicalActId, medicalActs.id))
            .where(eq(invoiceItems.invoiceId, invoiceId))

        return NextResponse.json({
            success: true,
            data: {
                ...invoice,
                items
            }
        })
    } catch (error) {
        console.error('Failed to fetch invoice details:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
