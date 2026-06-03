import { NextResponse } from 'next/server'
import { db } from '@/db'
import { services } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { name, code, description, isBillable, isActive } = body

        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (code !== undefined) updateData.code = code.toUpperCase()
        if (description !== undefined) updateData.description = description
        if (isBillable !== undefined) updateData.isBillable = isBillable
        if (isActive !== undefined) updateData.isActive = isActive

        updateData.updatedAt = new Date()

        const [updatedService] = await db
            .update(services)
            .set(updateData)
            .where(eq(services.id, id))
            .returning()

        if (!updatedService) {
            return NextResponse.json({
                success: false,
                error: 'Service non trouvé'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: updatedService
        })
    } catch (error: any) {
        console.error('Failed to update service:', error)
        if (error.code === '23505') {
            return NextResponse.json({
                success: false,
                error: 'Un service avec ce nom ou ce code existe déjà'
            }, { status: 400 })
        }
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de la mise à jour du service'
        }, { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const [deletedService] = await db
            .delete(services)
            .where(eq(services.id, id))
            .returning()

        if (!deletedService) {
            return NextResponse.json({
                success: false,
                error: 'Service non trouvé'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: deletedService
        })
    } catch (error: any) {
        console.error('Failed to delete service:', error)
        if (error.code === '23503') { // Foreign key constraint violation
            return NextResponse.json({
                success: false,
                error: 'Ce service ne peut pas être supprimé car il contient des actes médicaux liés'
            }, { status: 400 })
        }
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de la suppression du service'
        }, { status: 500 })
    }
}
