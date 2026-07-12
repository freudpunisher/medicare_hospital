import { NextResponse } from 'next/server'
import { db } from '@/db'
import { visits, triage } from '@/db/schema'
import { sql } from 'drizzle-orm'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      patientId,
      doctorId,
      consultationType,
      chiefComplaint,
      symptoms,
      symptomsDuration,
      painLevel,
      onsetDate,
      medicalHistory,
      surgicalHistory,
      familyHistory,
      allergies,
      currentMedications,
      notes,
      // Triage data
      temperature,
      bloodPressure,
      heartRate,
      respiratoryRate,
      oxygenSaturation,
      weight,
      height,
    } = body

    if (!patientId || !doctorId) {
      return NextResponse.json({
        success: false,
        error: 'Le patient et le médecin sont requis'
      }, { status: 400 })
    }

    // Generate consultation number: CONS-YYYYMMDD-XXX
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const countResult = await db.select({
      count: sql<number>`COUNT(*)::int`,
    }).from(visits)
      .where(sql`consultation_number LIKE ${'CONS-' + today + '-%'}`)

    const seq = ((countResult[0]?.count || 0) + 1).toString().padStart(3, '0')
    const consultationNumber = `CONS-${today}-${seq}`

    const [newVisit] = await db.insert(visits).values({
      patientId,
      doctorId,
      consultationNumber,
      consultationType: consultationType || 'general',
      status: 'waiting',
      chiefComplaint,
      symptoms,
      symptomsDuration,
      painLevel: painLevel ? String(painLevel) : null,
      onsetDate: onsetDate ? new Date(onsetDate) : null,
      medicalHistory,
      surgicalHistory,
      familyHistory,
      allergies,
      currentMedications,
      notes,
    }).returning()

    // Create triage if vitals provided
    if (temperature || bloodPressure || heartRate || weight) {
      await db.insert(triage).values({
        visitId: newVisit.id,
        temperature: temperature ? String(temperature) : null,
        bloodPressure,
        heartRate: heartRate ? String(heartRate) : null,
        respiratoryRate: respiratoryRate ? String(respiratoryRate) : null,
        oxygenSaturation: oxygenSaturation ? String(oxygenSaturation) : null,
        weight: weight ? String(weight) : null,
        height: height ? String(height) : null,
      })
    }

    return NextResponse.json({
      success: true,
      data: newVisit,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Failed to create consultation:', error)
    return NextResponse.json({
      success: false,
      error: error.message || 'Erreur lors de la création de la consultation'
    }, { status: 500 })
  }
}
