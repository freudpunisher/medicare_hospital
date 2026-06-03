import { NextResponse } from 'next/server'
import { db } from '@/db'
import { services } from '@/db/schema'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, code, description, isBillable } = body

        if (!name || !code) {
            return NextResponse.json({
                success: false,
                error: 'Le nom et le code du service sont requis'
            }, { status: 400 })
        }

        const [newService] = await db.insert(services).values({
            name,
            code: code.toUpperCase(),
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
                error: 'Un service avec ce nom ou ce code existe déjà'
            }, { status: 400 })
        }
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de la création du service'
        }, { status: 500 })
    }
}
