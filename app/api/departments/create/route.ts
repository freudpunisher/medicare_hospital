import { NextResponse } from 'next/server'
import { db } from '@/db'
import { departments } from '@/db/schema'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, description } = body

        if (!name) {
            return NextResponse.json({
                success: false,
                error: 'Le nom du département est requis'
            }, { status: 400 })
        }

        const [newDept] = await db.insert(departments).values({
            name,
            description,
            isActive: true,
        }).returning()

        return NextResponse.json({
            success: true,
            data: newDept
        })
    } catch (error: any) {
        console.error('Failed to create department:', error)
        if (error.code === '23505') { // Unique constraint violation
            return NextResponse.json({
                success: false,
                error: 'Un département avec ce nom existe déjà'
            }, { status: 400 })
        }
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de la création du département'
        }, { status: 500 })
    }
}
