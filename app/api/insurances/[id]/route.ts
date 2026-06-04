import { NextResponse } from 'next/server'
import { db } from '@/db'
import { insurances } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { name, contactInfo, email, phone, isActive } = body

        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (contactInfo !== undefined) updateData.contactInfo = contactInfo
        if (email !== undefined) updateData.email = email
        if (phone !== undefined) updateData.phone = phone
        if (isActive !== undefined) updateData.isActive = isActive

        updateData.updatedAt = new Date()

        const [updatedItem] = await db
            .update(insurances)
            .set(updateData)
            .where(eq(insurances.id, id))
            .returning()

        if (!updatedItem) {
            return NextResponse.json({
                success: false,
                error: 'Assurance non trouvée'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: updatedItem
        })
    } catch (error: any) {
        console.error('Failed to update insurance:', error)
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de la mise à jour de l\'assurance'
        }, { status: 500 })
    }
}

// DELETE is removed based on user request to protect records
export async function DELETE() {
    return NextResponse.json({
        success: false,
        error: 'La suppression des assurances est désactivée pour protéger l\'intégrité des données historiques.'
    }, { status: 403 })
}
