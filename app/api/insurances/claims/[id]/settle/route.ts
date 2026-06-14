import { NextResponse } from 'next/server'
import { db } from '@/db'
import { insuranceClaims, insurancePayments, invoices } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: claimId } = await params
        const body = await req.json()
        const { amount, referenceNumber, notes } = body

        if (!amount) {
            return NextResponse.json({ error: 'Amount is required' }, { status: 400 })
        }

        const result = await db.transaction(async (tx) => {
            // 1. Fetch the claim
            const claim = await tx.query.insuranceClaims.findFirst({
                where: eq(insuranceClaims.id, claimId),
            })

            if (!claim) {
                throw new Error('Claim not found')
            }

            // 2. Create the payment record
            const [payment] = await tx.insert(insurancePayments).values({
                insuranceId: claim.insuranceId,
                claimId: claim.id,
                amount: amount.toString(),
                referenceNumber,
                notes,
            }).returning()

            // 3. Update the claim status
            await tx.update(insuranceClaims)
                .set({ status: 'paid', paidAt: new Date() })
                .where(eq(insuranceClaims.id, claimId))

            // 4. Update the associated invoice
            // Set insuranceAmount to 0 and insurancePaidAmount to the actual paid amount
            await tx.update(invoices)
                .set({
                    insuranceAmount: '0',
                    insurancePaidAmount: amount.toString(),
                    updatedAt: new Date()
                })
                .where(eq(invoices.id, claim.invoiceId))

            return payment
        })

        return NextResponse.json({
            success: true,
            data: result
        })
    } catch (error: any) {
        console.error('Failed to settle claim:', error)
        return NextResponse.json({
            success: false,
            error: error.message || 'Failed to settle claim'
        }, { status: 500 })
    }
}
