import { NextResponse } from 'next/server'
import { db } from '@/db'
import { medicalActs } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await req.json()
        const { name, serviceId, specialtyId, basePrice, requiresAuthorization, isActive } = body

        const updateData: any = {}
        if (name !== undefined) updateData.name = name
        if (serviceId !== undefined) updateData.serviceId = serviceId
        if (specialtyId !== undefined) updateData.specialtyId = specialtyId
        if (basePrice !== undefined) updateData.basePrice = basePrice.toString()
        if (requiresAuthorization !== undefined) updateData.requiresAuthorization = requiresAuthorization
        if (isActive !== undefined) updateData.isActive = isActive

        updateData.updatedAt = new Date()

        const [updatedAct] = await db
            .update(medicalActs)
            .set(updateData)
            .where(eq(medicalActs.id, id))
            .returning()

        if (!updatedAct) {
            return NextResponse.json({
                success: false,
                error: 'Acte médical non trouvé'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: updatedAct
        })
    } catch (error: any) {
        console.error('Failed to update medical act:', error)
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de la mise à jour de l\'acte'
        }, { status: 500 })
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const [deletedAct] = await db
            .delete(medicalActs)
            .where(eq(medicalActs.id, id))
            .returning()

        if (!deletedAct) {
            return NextResponse.json({
                success: false,
                error: 'Acte médical non trouvé'
            }, { status: 404 })
        }

        return NextResponse.json({
            success: true,
            data: deletedAct
        })
    } catch (error: any) {
        console.error('Failed to delete medical act:', error)
        if (error.code === '23503') { // Foreign key constraint (e.g. linked to invoices)
            return NextResponse.json({
                success: false,
                error: 'Cet acte ne peut pas être supprimé car il figure déjà sur des factures ou des prescriptions'
            }, { status: 400 })
        }
        return NextResponse.json({
            success: false,
            error: 'Erreur lors de la suppression de l\'acte médical'
        }, { status: 500 })
    }
}
