import { NextResponse } from 'next/server'
import { db } from '@/db'
import { insuranceClaims, invoices } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { insuranceId, invoiceIds } = body

        if (!insuranceId || !invoiceIds || !Array.isArray(invoiceIds)) {
            return NextResponse.json({ error: 'Insurance ID and Invoice IDs are required' }, { status: 400 })
        }

        const results = await db.transaction(async (tx) => {
            const createdClaims = []

            for (const invId of invoiceIds) {
                // Fetch invoice details
                const inv = await tx.query.invoices.findFirst({
                    where: eq(invoices.id, invId),
                })

                if (!inv) continue

                // Create the claim
                const [claim] = await tx.insert(insuranceClaims).values({
                    insuranceId,
                    patientId: inv.patientId,
                    invoiceId: inv.id,
                    claimAmount: inv.insuranceAmount,
                    status: 'pending',
                }).returning()

                // Update invoice status to 'claimed' or similar if needed 
                // (For now, just keeping it pending but linked)

                createdClaims.push(claim)
            }

            return createdClaims
        })

        return NextResponse.json({
            success: true,
            data: results
        })
    } catch (error) {
        console.error('Failed to create claims:', error)
        return NextResponse.json({ error: 'Failed to create claims' }, { status: 500 })
    }
}
