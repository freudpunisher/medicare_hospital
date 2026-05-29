import { NextResponse } from 'next/server'
import { db } from '@/db'
import { insuranceClaims, patients, insurances, invoices } from '@/db/schema'
import { eq, desc } from 'drizzle-orm'

export async function GET() {
    try {
        const list = await db.select({
            id: insuranceClaims.id,
            status: insuranceClaims.status,
            claimAmount: insuranceClaims.claimAmount,
            approvedAmount: insuranceClaims.approvedAmount,
            deniedReason: insuranceClaims.deniedReason,
            submittedAt: insuranceClaims.submittedAt,
            paidAt: insuranceClaims.paidAt,
            createdAt: insuranceClaims.createdAt,
            insurance: {
                id: insurances.id,
                name: insurances.name
            },
            patient: {
                id: patients.id,
                firstName: patients.firstName,
                lastName: patients.lastName
            },
            invoice: {
                id: invoices.id,
                invoiceNumber: invoices.invoiceNumber
            }
        })
            .from(insuranceClaims)
            .innerJoin(insurances, eq(insuranceClaims.insuranceId, insurances.id))
            .innerJoin(patients, eq(insuranceClaims.patientId, patients.id))
            .innerJoin(invoices, eq(insuranceClaims.invoiceId, invoices.id))
            .orderBy(desc(insuranceClaims.createdAt))

        return NextResponse.json({
            success: true,
            data: list
        })
    } catch (error) {
        console.error('Failed to fetch insurance claims:', error)
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch insurance claims'
        }, { status: 500 })
    }
}
