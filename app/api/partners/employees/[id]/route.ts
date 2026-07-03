import { NextResponse } from 'next/server'
import { db } from '@/db'
import { corporateEmployees } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const employee = await db.query.corporateEmployees.findFirst({
      where: eq(corporateEmployees.id, id),
      with: {
        partner: true,
        patient: true,
      },
    })

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: employee })
  } catch (error) {
    console.error('Failed to fetch employee:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch employee' }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()
    const {
      partnerId,
      patientId,
      employeeNumber,
      department,
      position,
      hireDate,
      isActive,
    } = body

    const updateData: Record<string, unknown> = {}
    if (partnerId !== undefined) updateData.partnerId = partnerId
    if (patientId !== undefined) updateData.patientId = patientId
    if (employeeNumber !== undefined) updateData.employeeNumber = employeeNumber
    if (department !== undefined) updateData.department = department
    if (position !== undefined) updateData.position = position
    if (hireDate !== undefined) updateData.hireDate = hireDate
    if (isActive !== undefined) updateData.isActive = isActive

    const [updated] = await db
      .update(corporateEmployees)
      .set(updateData)
      .where(eq(corporateEmployees.id, id))
      .returning()

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: updated })
  } catch (error) {
    console.error('Failed to update employee:', error)
    return NextResponse.json({ success: false, error: 'Failed to update employee' }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const [deleted] = await db
      .delete(corporateEmployees)
      .where(eq(corporateEmployees.id, id))
      .returning()

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: deleted })
  } catch (error) {
    console.error('Failed to delete employee:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete employee' }, { status: 500 })
  }
}
