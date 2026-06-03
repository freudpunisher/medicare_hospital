import { NextResponse } from 'next/server'
import { db } from '@/db'
import { patients, patientInsurances } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const patient = await db.query.patients.findFirst({
      where: eq(patients.id, id),
      with: {
        insurance: true, // Legacy join
        insurances: {
          with: {
            insurance: true
          }
        },
        quartier: {
          with: {
            zone: {
              with: {
                commune: {
                  with: {
                    province: true,
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!patient) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    return NextResponse.json(patient)
  } catch (error) {
    console.error('Failed to fetch patient:', error)
    return NextResponse.json({ error: 'Failed to fetch patient' }, { status: 500 })
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
      firstName,
      lastName,
      dateOfBirth,
      gender,
      phone,
      address,
      quartierId,
      // Multiple insurances support
      insurances,
    } = body

    const updateData: Record<string, unknown> = {}
    if (firstName !== undefined) updateData.firstName = firstName
    if (lastName !== undefined) updateData.lastName = lastName
    if (dateOfBirth !== undefined) updateData.dateOfBirth = dateOfBirth
    if (gender !== undefined) updateData.gender = gender
    if (phone !== undefined) updateData.phone = phone
    if (address !== undefined) updateData.address = address
    if (quartierId !== undefined) updateData.quartierId = quartierId

    // Determine if the patient is considered insured overall based on new insurances array
    if (insurances !== undefined) {
      const hasActiveInsurance = insurances.some((ins: any) => {
        if (!ins.insuranceId || !ins.insuranceExpiryDate) return false
        const today = new Date().toISOString().slice(0, 10)
        return ins.insuranceExpiryDate >= today
      })
      updateData.isInsured = hasActiveInsurance

      // For backward compatibility, update legacy fields with the first insurance
      const primaryInsurance = insurances[0]
      updateData.insuranceId = primaryInsurance?.insuranceId ?? null
      updateData.insuranceNumber = primaryInsurance?.insuranceNumber ?? null
      updateData.insuranceExpiryDate = primaryInsurance?.insuranceExpiryDate ?? null
    }

    // Perform the update
    const result = await db
      .update(patients)
      .set(updateData)
      .where(eq(patients.id, id))
      .returning()

    if (result.length === 0) {
      return NextResponse.json({ error: 'Patient not found' }, { status: 404 })
    }

    // Sync insurances in the join table
    if (insurances !== undefined) {
      // Simple sync: delete all and re-insert
      await db.delete(patientInsurances).where(eq(patientInsurances.patientId, id))

      if (insurances.length > 0) {
        const insuranceValues = insurances.map((ins: any, index: number) => ({
          patientId: id,
          insuranceId: ins.insuranceId,
          insuranceNumber: ins.insuranceNumber ?? null,
          insuranceCardNumber: ins.insuranceCardNumber ?? null,
          insuranceExpiryDate: ins.insuranceExpiryDate ?? null,
          coverageRate: ins.coverageRate ?? '0',
          isPrimary: index === 0,
        }))

        await db.insert(patientInsurances).values(insuranceValues)
      }
    }

    return NextResponse.json(result[0], { status: 200 })
  } catch (error) {
    console.error('Failed to update patient:', error)
    return NextResponse.json({ error: 'Failed to update patient' }, { status: 500 })
  }
}
