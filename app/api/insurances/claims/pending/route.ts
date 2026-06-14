import { NextResponse } from 'next/server'
import { db } from '@/db'
import { invoices, patients, insuranceInvoices } from '@/db/schema'
import { and, eq, gt, isNull, sql } from 'drizzle-orm'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const insuranceId = searchParams.get('insuranceId')

        if (!insuranceId) {
            return NextResponse.json({ error: 'Insurance ID is required' }, { status: 400 })
        }

        // Find all invoices that belong to this insurance (via patient's primary insurance)
        // and have a balance for insurance, and haven't been claimed yet
        const pendingInvoices = await db.query.invoices.findMany({
            where: and(
                gt(invoices.insuranceAmount, '0'),
                sql`${invoices.insuranceAmount} > ${invoices.insurancePaidAmount}`,
                // Exclude already claimed invoices
                sql`NOT EXISTS (SELECT 1 FROM insurance_claims WHERE invoice_id = ${invoices.id})`
            ),
            with: {
                patient: {
                    with: {
                        insurances: {
                            where: (pi, { eq }) => eq(pi.insuranceId, insuranceId),
                            with: {
                                insurance: true
                            }
                        }
                    }
                },
                items: {
                    with: {
                        medicalAct: true
                    }
                }
            }
        })

        // Filter to only include those that actually match the requested insurance
        const filtered = pendingInvoices.filter(inv =>
            inv.patient && inv.patient.insurances && inv.patient.insurances.some((ins: any) => ins.insuranceId === insuranceId)
        )

        return NextResponse.json({
            success: true,
            data: filtered
        })
    } catch (error) {
        console.error('Failed to fetch pending invoices:', error)
        return NextResponse.json({ error: 'Failed to fetch pending invoices' }, { status: 500 })
    }
}
