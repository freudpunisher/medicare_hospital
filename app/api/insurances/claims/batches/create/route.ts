import { NextResponse } from 'next/server'
import { db } from '@/db'
import { insuranceBatches, insuranceClaims, invoices } from '@/db/schema'
import { eq, sql, and } from 'drizzle-orm'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { insuranceId, invoiceIds } = body

        if (!insuranceId || !invoiceIds || !Array.isArray(invoiceIds)) {
            return NextResponse.json({ error: 'Insurance ID and Invoice IDs are required' }, { status: 400 })
        }

        const batch = await db.transaction(async (tx) => {
            // 1. Generate Batch Number: BORD-YYYYMMDD-XXX
            const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
            const prefix = `BORD-${today}-`

            const lastBatch = await tx.query.insuranceBatches.findFirst({
                where: sql`batch_number LIKE ${prefix + '%'}`,
                orderBy: [sql`batch_number DESC`]
            })

            let nextNum = 1
            if (lastBatch) {
                const parts = lastBatch.batchNumber.split('-')
                nextNum = parseInt(parts[parts.length - 1]) + 1
            }
            const batchNumber = `${prefix}${nextNum.toString().padStart(3, '0')}`

            // 2. Calculate Total Amount
            const selectedInvoices = []
            let totalAmount = 0

            for (const invId of invoiceIds) {
                const inv = await tx.query.invoices.findFirst({
                    where: eq(invoices.id, invId),
                })
                if (inv) {
                    selectedInvoices.push(inv)
                    totalAmount += parseFloat(inv.insuranceAmount)
                }
            }

            // 3. Create the Batch
            const [newBatch] = await tx.insert(insuranceBatches).values({
                insuranceId,
                batchNumber,
                totalAmount: totalAmount.toString(),
                status: 'pending',
            }).returning()

            // 4. Create Claim Records linked to the batch
            for (const inv of selectedInvoices) {
                // Enforce uniqueness: check if invoice already claimed
                // (Postgres constraint insurance_claims_invoice_id_unique will also catch this)
                await tx.insert(insuranceClaims).values({
                    batchId: newBatch.id,
                    insuranceId,
                    patientId: inv.patientId,
                    invoiceId: inv.id,
                    claimAmount: inv.insuranceAmount,
                    status: 'pending',
                })
            }

            return newBatch
        })

        return NextResponse.json({
            success: true,
            data: batch
        })
    } catch (error: any) {
        console.error('Failed to create bordereau:', error)
        if (error.code === '23505') {
            return NextResponse.json({
                error: 'Une ou plusieurs factures sont déjà incluses dans un autre bordereau.'
            }, { status: 400 })
        }
        return NextResponse.json({ error: 'Failed to create bordereau' }, { status: 500 })
    }
}
