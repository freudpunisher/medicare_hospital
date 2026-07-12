import { NextResponse } from 'next/server'
import { db } from '@/db'
import { visits } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const visit = await db.query.visits.findFirst({
      where: eq(visits.id, id),
      with: {
        patient: true,
        doctor: {
          with: {
            specialty: true,
          },
        },
        triage: true,
        diagnoses: true,
        prescriptions: {
          with: {
            doctor: true,
            items: true,
          },
        },
        medicalDecisions: {
          with: {
            specialist: true,
          },
        },
        examRequests: {
          with: {
            results: true,
          },
        },
      },
    })

    if (!visit) {
      return NextResponse.json({
        success: false,
        error: 'Consultation non trouvée'
      }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: visit,
    })
  } catch (error) {
    console.error('Failed to fetch consultation:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors du chargement de la consultation'
    }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await req.json()

    const allowedFields = [
      'status', 'consultationType', 'chiefComplaint', 'symptoms',
      'symptomsDuration', 'painLevel', 'onsetDate',
      'medicalHistory', 'surgicalHistory', 'familyHistory',
      'allergies', 'currentMedications', 'notes',
    ]

    const updateData: any = {}
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = field === 'painLevel' ? String(body[field]) : body[field]
      }
    }

    if (body.doctorId) updateData.doctorId = body.doctorId
    if (body.visitDate) updateData.visitDate = new Date(body.visitDate)

    if (Object.keys(updateData).length > 0) {
      updateData.updatedAt = new Date()
      await db.update(visits).set(updateData).where(eq(visits.id, id))
    }

    return NextResponse.json({
      success: true,
      message: 'Consultation mise à jour',
    })
  } catch (error) {
    console.error('Failed to update consultation:', error)
    return NextResponse.json({
      success: false,
      error: 'Erreur lors de la mise à jour'
    }, { status: 500 })
  }
}
