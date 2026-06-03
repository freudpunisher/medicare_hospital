import { NextResponse } from 'next/server'
import { db } from '@/db'
import { services } from '@/db/schema'
import { desc, sql } from 'drizzle-orm'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, description, isBillable } = body

        if (!name) {
            return NextResponse.json({
                success: false,
                error: 'Le nom du service est requis'
            }, { status: 400 })
        }

        // Automatic Code Generation: SVC-001, SVC-002...
        const lastService = await db.select({ code: services.code })
            .from(services)
            .where(sql`code LIKE 'SVC-%'`)
            .orderBy(desc(services.code))
            .limit(1)

        let nextCode = 'SVC-001'
        if (lastService.length > 0) {
            const lastCode = lastService[0].code
            const lastNum = parseInt(lastCode.split('-')[1])
            if (!isNaN(lastNum)) {
                nextCode = `SVC-${(lastNum + 1).toString().padStart(3, '0')}`
            }
        }

        const [newService] = await db.insert(services).values({
            name,
            code: nextCode,
            description,
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
