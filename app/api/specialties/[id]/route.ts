import { NextResponse } from 'next/server'
import { db } from '@/db'
import { specialties } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { name, departmentId, description, isActive } = body

        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (departmentId !== undefined) updateData.departmentId = departmentId
        if (description !== undefined) updateData.description = description
        if (isActive !== undefined) updateData.isActive = isActive

        updateData.updatedAt = new Date()

        const [updatedSpecialty] = await db
            .update(specialties)
            .set(updateData)
            .where(eq(specialties.id, id))
            .returning()

        if (!updatedSpecialty) {
            return NextResponse.json({
                success: false,
                error: 'Spécialité non trouvée'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: updatedSpecialty
        })
    } catch (error: any) {
        console.error('Failed to update specialty:', error)
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de la mise à jour de la spécialité'
        }, { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const [deletedSpecialty] = await db
            .delete(specialties)
            .where(eq(specialties.id, id))
            .returning()

        if (!deletedSpecialty) {
            return NextResponse.json({
                success: false,
                error: 'Spécialité non trouvée'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: deletedSpecialty
        })
    } catch (error: any) {
        console.error('Failed to delete specialty:', error)
        if (error.code === '23503') { // Foreign key constraint violation
            return NextResponse.json({
                success: false,
                error: 'Cette spécialité ne peut pas être supprimée car elle est liée à des médecins ou des actes médicaux'
            }, { status: 400 })
        }
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de la suppression de la spécialité'
        }, { status: 500 })
    }
}
