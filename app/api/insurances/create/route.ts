import { NextResponse } from 'next/server'
import { db } from '@/db'
import { insurances } from '@/db/schema'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, contactInfo, email, phone } = body

        if (!name) {
            return NextResponse.json({
                success: false,
                error: 'Le nom de l\'assurance est requis'
            }, { status: 400 })
        }

        const [newItem] = await db.insert(insurances).values({
            name,
            contactInfo,
            email,
            phone,
            isActive: true,
        }).returning()

        return NextResponse.json({
            success: true,
            data: newItem
        })
    } catch (error: any) {
        console.error('Failed to create insurance:', error)
        if (error.code === '23505') {
            return NextResponse.json({
                success: false,
                error: 'Une assurance avec ce nom existe déjà'
            }, { status: 400 })
        }
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de la création de l\'assurance'
        }, { status: 500 })
    }
}
