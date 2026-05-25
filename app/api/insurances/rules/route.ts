import { NextResponse } from 'next/server'
import { db } from '@/db'
import { insuranceServiceRules } from '@/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url)
        const insuranceId = searchParams.get('insuranceId')
        const serviceId = searchParams.get('serviceId')

        if (!insuranceId) {
            return NextResponse.json({ error: 'insuranceId is required' }, { status: 400 })
        }

        const filters = [eq(insuranceServiceRules.insuranceId, insuranceId)]
        if (serviceId) {
            filters.push(eq(insuranceServiceRules.serviceId, serviceId))
        }

        const data = await db.query.insuranceServiceRules.findMany({
            where: and(...filters),
        })

        return NextResponse.json({ data })
    } catch (error) {
        console.error('Failed to fetch insurance rules:', error)
        return NextResponse.json({ error: 'Failed to fetch insurance rules' }, { status: 500 })
    }
}
