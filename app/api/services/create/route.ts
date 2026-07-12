import { NextResponse } from 'next/server'
import { db } from '@/db'
import { services } from '@/db/schema'
import { sql } from 'drizzle-orm'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, description, isBillable, type } = body

        if (!name) {
            return NextResponse.json({
                success: false,
                error: 'Le nom du service est requis'
            }, { status: 400 })
        }

        // Automatic Code Generation: SVC-001, SVC-002...
        const result = await db.select({
            maxNum: sql<number>`MAX(CAST(SUBSTRING(${services.code}, 5) AS INTEGER))`
        })
            .from(services)
            .where(sql`${services.code} ~ '^SVC-\\d+$'`)

        let nextCode = 'SVC-001'
        const maxNum = result[0]?.maxNum
        if (maxNum != null) {
            nextCode = `SVC-${(maxNum + 1).toString().padStart(3, '0')}`
        }

        const [newService] = await db.insert(services).values({
            name,
            code: nextCode,
            description,
            type: type ?? 'other',
            isBillable: isBillable ?? true,
            isActive: true,
        }).returning()

        return NextResponse.json({
            success: true,
            data: newService
        })
    } catch (error: any) {
        console.error('Failed to create service:', error)
        if (error.code === '23505') { // Unique constraint violation
            return NextResponse.json({
                success: false,
                error: 'Un service avec ce nom existe déjà'
            }, { status: 400 })
        }
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de la création du service'
        }, { status: 500 })
    }
}
