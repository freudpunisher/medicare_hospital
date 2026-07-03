import { NextResponse } from 'next/server'
import { db } from '@/db'
import { patients, patientInsurances, corporateEmployees } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      address,
      quartierId,
      isCorporateEmployee = false,
      corporatePartnerId,
      employeeNumber,
      department,
      position,
      hireDate,
      // Multiple insurances support
      insurances = [],
    } = body

    if (!firstName || !lastName || !dateOfBirth || !gender || !phone) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (isCorporateEmployee) {
      if (!corporatePartnerId || !employeeNumber) {
        return NextResponse.json({ error: 'Missing required corporate employee fields: corporatePartnerId, employeeNumber' }, { status: 400 })
      }
    }

    // Determine if the patient is considered insured overall
    const hasActiveInsurance = insurances.some((ins: any) => {
      if (!ins.insuranceId || !ins.insuranceExpiryDate) return false
      const today = new Date().toISOString().slice(0, 10)
      return ins.insuranceExpiryDate >= today
    })

    // Create the patient first
    // For backward compatibility, we'll store the first insurance in the patient table if it exists
    const primaryInsurance = insurances[0]

    const created = await db
      .insert(patients)
      .values({
        firstName,
        lastName,
        dateOfBirth,
        gender,
        phone,
        address: address ?? null,
        quartierId: quartierId ?? null,
        isInsured: hasActiveInsurance,
        isCorporateEmployee,
        corporatePartnerId: corporatePartnerId ?? null,
        // Legacy fields mapping
        insuranceId: primaryInsurance?.insuranceId ?? null,
        insuranceNumber: primaryInsurance?.insuranceNumber ?? null,
        insuranceExpiryDate: primaryInsurance?.insuranceExpiryDate ?? null,
      })
      .returning()

    const patient = created[0]

    // Create corporate employee if applicable
    if (isCorporateEmployee && patient) {
      const [employee] = await db
        .insert(corporateEmployees)
        .values({
          partnerId: corporatePartnerId,
          patientId: patient.id,
          employeeNumber,
          department: department ?? null,
          position: position ?? null,
          hireDate: hireDate ? new Date(hireDate) : null,
        })
        .returning()

      await db
        .update(patients)
        .set({ corporateEmployeeId: employee.id })
        .where(eq(patients.id, patient.id))

      patient.corporateEmployeeId = employee.id
    }

    // Save all insurances to the new join table
    if (insurances.length > 0) {
      const insuranceValues = insurances.map((ins: any, index: number) => ({
        patientId: patient.id,
        insuranceId: ins.insuranceId,
        insuranceNumber: ins.insuranceNumber ?? null,
        insuranceCardNumber: ins.insuranceCardNumber ?? null,
        insuranceExpiryDate: ins.insuranceExpiryDate ?? null,
        coverageRate: ins.coverageRate ?? '0',
        isPrimary: index === 0,
      }))

      await db.insert(patientInsurances).values(insuranceValues)
    }

    return NextResponse.json(patient, { status: 201 })
  } catch (error) {
    console.error('Failed to create patient:', error)
    return NextResponse.json({ error: 'Failed to create patient' }, { status: 500 })
  }
}
