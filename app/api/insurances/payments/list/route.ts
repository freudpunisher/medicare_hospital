import { NextResponse } from 'next/server'
import { db } from '@/db'
import { insurancePayments, insuranceClaims, insurances, insuranceBatches } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
    try {
        const list = await db.select({
            id: insurancePayments.id,
            amount: insurancePayments.amount,
            paymentMethod: insurancePayments.paymentMethod,
            paymentDate: insurancePayments.paymentDate,
            referenceNumber: insurancePayments.referenceNumber,
            notes: insurancePayments.notes,
            createdAt: insurancePayments.createdAt,
            insurance: {
                id: insurances.id,
                name: insurances.name
            },
            claim: {
                id: insuranceClaims.id,
                status: insuranceClaims.status
            },
            batch: {
                id: insuranceBatches.id,
                batchNumber: insuranceBatches.batchNumber
            }
        })
            .from(insurancePayments)
            .innerJoin(insurances, eq(insurancePayments.insuranceId, insurances.id))
            .leftJoin(insuranceClaims, eq(insurancePayments.claimId, insuranceClaims.id))
            .leftJoin(insuranceBatches, eq(insurancePayments.batchId, insuranceBatches.id))
            .orderBy(desc(insurancePayments.createdAt))

        return NextResponse.json({
            success: true,
            data: list
        })
    } catch (error) {
        console.error('Failed to fetch insurance payments:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch insurance payments'
        }, { status: 500 })
    }
}
