import { NextResponse } from 'next/server'
import { db } from '@/db'
import { departments } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { name, description, isActive } = body

        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (description !== undefined) updateData.description = description
        if (isActive !== undefined) updateData.isActive = isActive

        updateData.updatedAt = new Date()

        const [updatedDept] = await db
            .update(departments)
            .set(updateData)
            .where(eq(departments.id, id))
            .returning()

        if (!updatedDept) {
            return NextResponse.json({
                success: false,
                error: 'Département non trouvé'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: updatedDept
        })
    } catch (error: any) {
        console.error('Failed to update department:', error)
        if (error.code === '23505') {
            return NextResponse.json({
                success: false,
                error: 'Un département avec ce nom existe déjà'
            }, { status: 400 })
        }
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de la mise à jour du département'
        }, { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const [deletedDept] = await db
            .delete(departments)
            .where(eq(departments.id, id))
            .returning()

        if (!deletedDept) {
            return NextResponse.json({
                success: false,
                error: 'Département non trouvé'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: deletedDept
        })
    } catch (error: any) {
        console.error('Failed to delete department:', error)
        if (error.code === '23503') { // Foreign key constraint violation
            return NextResponse.json({
                success: false,
                error: 'Ce département ne peut pas être supprimé car il contient des spécialités ou des services'
            }, { status: 400 })
        }
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de la suppression du département'
        }, { status: 500 })
    }
}
