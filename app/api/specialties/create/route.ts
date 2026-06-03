import { NextResponse } from 'next/server'
import { db } from '@/db'
import { specialties } from '@/db/schema'

export async function POST(req: Request) {
    try {
        const body = await req.json()
        const { name, departmentId, description } = body

        if (!name || !departmentId) {
            return NextResponse.json({
                success: false,
                error: 'Le nom de la spécialité et le département sont requis'
            }, { status: 400 })
        }

        const [newSpecialty] = await db.insert(specialties).values({
            name,
            departmentId,
            description,
            isActive: true,
        }).returning()

        return NextResponse.json({
            success: true,
            data: newSpecialty
        })
    } catch (error: any) {
        console.error('Failed to create specialty:', error)
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de la création de la spécialité'
        }, { status: 500 })
    }
}
