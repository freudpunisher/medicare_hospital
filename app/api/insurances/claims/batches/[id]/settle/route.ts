import { NextResponse } from 'next/server'
import { db } from '@/db'
import { insuranceBatches, insuranceClaims, insurancePayments, invoices } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: batchId } = await params
        const body = await req.json()
        const { amount, referenceNumber, notes } = body

        if (!amount) {
            return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
        }

        const result = await db.transaction(async (tx) => {
            // 1. Fetch the batch
            const batch = await tx.query.insuranceBatches.findFirst({
                where: eq(insuranceBatches.id, batchId),
                with: {
                    claims: true
                }
            })

            if (!batch) {
                throw new Error('Bordereau introuvable')
            }

            // 2. Create the payment record for the batch
            const [payment] = await tx.insert(insurancePayments).values({
                insuranceId: batch.insuranceId,
                batchId: batch.id,
                amount: amount.toString(),
                paymentMethod: body.paymentMethod || 'transfer',
                referenceNumber,
                notes,
            }).returning()

            // 3. Update the batch status
            await tx.update(insuranceBatches)
                .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
                .where(eq(insuranceBatches.id, batch.id))

            // 4. Update all linked claims and their associated invoices
            for (const claim of batch.claims) {
                // Update claim status
                await tx.update(insuranceClaims)
                    .set({ status: 'paid', paidAt: new Date(), updatedAt: new Date() })
                    .where(eq(insuranceClaims.id, claim.id))

                // Update invoice financial state
                // We assume the payment covers the claimed amount for each invoice in the batch
                await tx.update(invoices)
                    .set({
                        insuranceAmount: '0',
                        insurancePaidAmount: claim.claimAmount, // Actual distributed credit
                        updatedAt: new Date()
                    })
                    .where(eq(invoices.id, claim.invoiceId))
            }

            return payment
        })

        return NextResponse.json({
            success: true,
            data: result
        })
    } catch (error: any) {
        console.error('Failed to settle bordereau:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Échec du règlement du bordereau'
        }, { status: 500 })
    }
}
