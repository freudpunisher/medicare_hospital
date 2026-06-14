import { NextResponse } from 'next/server'
import { db } from '@/db'
import { insuranceBatches } from '@/db/schema'
import { desc } from 'drizzle-orm'

export async function GET() {
    try {
        const batches = await db.query.insuranceBatches.findMany({
            orderBy: [desc(insuranceBatches.createdAt)],
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

        return NextResponse.json({
            success: true,
            data: batches
        })
    } catch (error) {
        console.error('Failed to fetch bordereaux:', error)
        return NextResponse.json({ error: 'Failed to fetch bordereaux' }, { status: 500 })
    }
}
