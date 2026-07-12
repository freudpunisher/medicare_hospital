import { NextResponse } from 'next/server'
import { db } from '@/db'
import { invoices, invoiceItems, payments, partnershipVisitLogs, partnershipDiscountHistory } from '@/db/schema'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const {
            patientId,
            totalAmount,
            insuranceAmount,
            patientAmount,
            discountAmount,
            partnershipDiscountAmount,
            partnershipData,
            visitId,
            notes,
            items,
            paymentMethod,
            paymentReference,
            cashSessionId,
        } = body

        if (!patientId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Patient ID and items are required' }, { status: 400 })
        }

        // Generate unique invoice number
        const date = new Date()
        const dateStr = date.toISOString().split('T')[0].replace(/-/g, '')
        const randomStr = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
        const invoiceNumber = `INV-${dateStr}-${randomStr}`

        // Use a transaction to ensure invoice, items, and payment are created together
        const result = await db.transaction(async (tx) => {
            const [invoice] = await tx
                .insert(invoices)
                .values({
                    invoiceNumber,
                    patientId,
                    totalAmount: totalAmount.toString(),
                    insuranceAmount: insuranceAmount.toString(),
                    patientAmount: patientAmount.toString(),
                    discountAmount: (discountAmount || 0).toString(),
                    visitId,
                    notes,
                    status: paymentMethod === 'loan' ? 'pending' : (paymentMethod ? 'paid' : 'pending'),
                })
                .returning()

            const itemsToInsert = items.map((item: any) => ({
                invoiceId: invoice.id,
                medicalActId: item.actId,
                quantity: item.quantity.toString(),
                unitPrice: item.unitPrice.toString(),
                totalPrice: item.totalPrice.toString(),
            }))

            const insertedItems = await tx.insert(invoiceItems).values(itemsToInsert).returning()

            // Automatically create payment if method provided
            if (paymentMethod) {
                await tx.insert(payments).values({
                    invoiceId: invoice.id,
                    patientId,
                    amount: patientAmount.toString(),
                    paymentMethod,
                    referenceNumber: paymentReference || null,
                    cashSessionId: cashSessionId || null,
                    notes: `Automatic payment on invoice creation${discountAmount > 0 ? ` (Reduction: ${discountAmount} FBU)` : ''}${partnershipDiscountAmount > 0 ? ` (Corporate: ${partnershipDiscountAmount} FBU)` : ''}`,
                })
            }

            // Save partnership visit log and discount history
            if (partnershipData && partnershipDiscountAmount > 0) {
                await tx
                    .insert(partnershipVisitLogs)
                    .values({
                        partnerId: partnershipData.partnerId,
                        employeeId: partnershipData.employeeId,
                        visitId: null,
                        invoiceId: invoice.id,
                        totalDiscountApplied: partnershipDiscountAmount.toString(),
                        originalTotal: totalAmount.toString(),
                        finalTotal: (Number(totalAmount) - Number(partnershipDiscountAmount)).toString(),
                    })

                for (const pd of partnershipData.items) {
                    const invItem = insertedItems[pd.itemIndex]
                    if (!invItem) continue
                    await tx.insert(partnershipDiscountHistory).values({
                        partnerId: partnershipData.partnerId,
                        invoiceItemId: invItem.id,
                        ruleId: pd.ruleId,
                        originalPrice: pd.originalPrice.toString(),
                        discountedPrice: pd.discountedPrice.toString(),
                        discountAmount: pd.discountAmount.toString(),
                        discountType: pd.discountType,
                        discountValue: pd.discountValue.toString(),
                    })
                }
            }

            return invoice
        })

        return NextResponse.json({ data: result }, { status: 201 })
    } catch (error) {
        console.error('Failed to create invoice and payment:', error)
        return NextResponse.json({ error: 'Failed to create invoice and payment' }, { status: 500 })
    }
}
