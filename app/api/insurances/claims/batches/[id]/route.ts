import { NextResponse } from 'next/server'
import { db } from '@/db'
import { insuranceBatches } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = await params
        const batch = await db.query.insuranceBatches.findFirst({
            where: eq(insuranceBatches.id, id),
            with: {
                insurance: true,
                claims: {
                    with: {
                        patient: {
                            with: {
                                insurances: true
                            }
                        },
                        invoice: {
                            with: {
                                items: {
                                    with: {
                                        medicalAct: true
                                    }
                                }
                            }
                        }
                    }
                },
                payments: true
            }
        })

        if (!batch) {
            return NextResponse.json({ error: 'Batch not found' }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: batch
        })
    } catch (error) {
        console.error('Failed to fetch batch details:', error)
        return NextResponse.json({ error: 'Failed to fetch batch details' }, { status: 500 })
    }
}
