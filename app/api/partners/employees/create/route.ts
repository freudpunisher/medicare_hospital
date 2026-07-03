import { NextResponse } from 'next/server'
import { db } from '@/db'
import { corporateEmployees } from '@/db/schema'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      partnerId,
      patientId,
      employeeNumber,
      department,
      position,
      hireDate,
    } = body

    if (!partnerId || !patientId || !employeeNumber) {
      return NextResponse.json({ success: false, error: 'Missing required fields: partnerId, patientId, employeeNumber' }, { status: 400 })
    }

    const [newEmployee] = await db
      .insert(corporateEmployees)
      .values({
        partnerId,
        patientId,
        employeeNumber,
        department: department ?? null,
        position: position ?? null,
        hireDate: hireDate ?? null,
      })
      .returning()

    return NextResponse.json({ success: true, data: newEmployee }, { status: 201 })
  } catch (error) {
    console.error('Failed to create corporate employee:', error)
    return NextResponse.json({ success: false, error: 'Failed to create corporate employee' }, { status: 500 })
  }
}
