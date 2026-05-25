import { NextResponse } from 'next/server'
import { db } from '@/db'
import { invoices, invoiceItems } from '@/db/schema'
import { v4 as uuidv4 } from 'uuid'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const {
            patientId,
            totalAmount,
            insuranceAmount,
            patientAmount,
            visitId,
            notes,
            items,
        } = body

        if (!patientId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Patient ID and items are required' }, { status: 400 })
        }

        // Generate unique invoice number
        const date = new Date()
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
        const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        const invoiceNumber = `INV-${dateStr}-${randomStr}`

        // Use a transaction to ensure both invoice and items are created
        const result = await db.transaction(async (tx) => {
            const [invoice] = await tx
                .insert(invoices)
                .values({
                    invoiceNumber,
                    patientId,
                    totalAmount: totalAmount.toString(),
                    insuranceAmount: insuranceAmount.toString(),
                    patientAmount: patientAmount.toString(),
                    visitId,
                    notes,
                    status: 'pending',
                })
                .returning()

            const itemsToInsert = items.map((item: any) => ({
                invoiceId: invoice.id,
                medicalActId: item.actId,
                quantity: item.quantity.toString(),
                unitPrice: item.unitPrice.toString(),
                totalPrice: item.totalPrice.toString(),
            }))

            await tx.insert(invoiceItems).values(itemsToInsert)

            return invoice
        })

        return NextResponse.json({ data: result }, { status: 201 })
    } catch (error) {
        console.error('Failed to create invoice:', error)
        return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 })
    }
}
