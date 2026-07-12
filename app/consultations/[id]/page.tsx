"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft, ClipboardList, User, Stethoscope, Calendar, Clock,
  Thermometer, Heart, Wind, Weight, Activity, FileText, Pill,
  AlertTriangle, CheckCircle2, XCircle, Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import { cn } from "@/lib/utils"

interface Triage {
  temperature: string | null
  bloodPressure: string | null
  heartRate: string | null
  respiratoryRate: string | null
  oxygenSaturation: string | null
  weight: string | null
  height: string | null
  bmi: string | null
  painLevel: string | null
  notes: string | null
}

interface Diagnosis {
  id: string
  diagnosisType: string
  diagnosisCode: string | null
  diagnosisName: string | null
  icdCode: string | null
  notes: string | null
}

interface PrescriptionItem {
  id: string
  medicineName: string
  dosage: string | null
  frequency: string | null
  duration: string | null
  notes: string | null
}

interface Prescription {
  id: string
  notes: string | null
  doctor: { fullName: string | null }
  items: PrescriptionItem[]
}

interface MedicalDecision {
  id: string
  decision: string
  reason: string | null
  followUpDate: string | null
  specialist: { fullName: string | null } | null
}

interface ExamResult {
  id: string
  resultText: string | null
  resultDate: string
}

interface ExamRequest {
  id: string
  examType: string
  examName: string
  priority: string
  status: string
  results: ExamResult[]
}

interface Doctor {
  id: string
  fullName: string | null
  specialty: { id: string; name: string } | null
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  patientNumber: number
  gender: string
  dateOfBirth: string
  phone: string
}

interface Consultation {
  id: string
  consultationNumber: string
  consultationType: string
  status: string
  visitDate: string
  chiefComplaint: string | null
  symptoms: string | null
  symptomsDuration: string | null
  painLevel: string | null
  onsetDate: string | null
  medicalHistory: string | null
  surgicalHistory: string | null
  familyHistory: string | null
  allergies: string | null
  currentMedications: string | null
  notes: string | null
  createdAt: string
  patient: Patient
  doctor: Doctor
  triage: Triage[]
  diagnoses: Diagnosis[]
  prescriptions: Prescription[]
  medicalDecisions: MedicalDecision[]
  examRequests: ExamRequest[]
}

const statusLabels: Record<string, { label: string; className: string }> = {
  waiting: { label: "En attente", className: "bg-amber-500/10 text-amber-600" },
  in_consultation: { label: "En cours", className: "bg-blue-500/10 text-blue-600" },
  in_exam: { label: "En examen", className: "bg-purple-500/10 text-purple-600" },
  in_lab: { label: "Au laboratoire", className: "bg-cyan-500/10 text-cyan-600" },
  in_radiology: { label: "En radiologie", className: "bg-indigo-500/10 text-indigo-600" },
  in_pharmacy: { label: "À la pharmacie", className: "bg-pink-500/10 text-pink-600" },
  hospitalized: { label: "Hospitalisé", className: "bg-orange-500/10 text-orange-600" },
  completed: { label: "Terminée", className: "bg-green-500/10 text-green-600" },
  cancelled: { label: "Annulée", className: "bg-red-500/10 text-red-600" },
}

const typeLabels: Record<string, string> = {
  general: "Générale", pediatric: "Pédiatrique", ophthalmology: "Ophtalmologique", gynecology: "Gynécologique",
}

const decisionLabels: Record<string, string> = {
  return_home: "Retour à domicile", follow_up: "Suivi", refer_to_specialist: "Référer à un spécialiste",
  hospitalization: "Hospitalisation", surgery: "Chirurgie", emergency: "Urgence", refer_to_other: "Référer ailleurs",
}

export default function ConsultationDetailPage() {
  const params = useParams()
  const [consultation, setConsultation] = useState<Consultation | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConsultation()
  }, [])

  async function fetchConsultation() {
    try {
      const res = await fetch(`/api/consultations/${params.id}`)
      const result = await res.json()
      if (result.success) setConsultation(result.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-20 text-center flex flex-col items-center gap-4">
        <Loader2 className="size-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-bold">Chargement de la consultation...</p>
      </div>
    )
  }

  if (!consultation) {
    return (
      <div className="p-20 text-center">
        <p className="text-destructive font-bold">Consultation non trouvée</p>
        <Button variant="outline" className="mt-4 rounded-full" asChild>
          <Link href="/consultations">Retour aux consultations</Link>
        </Button>
      </div>
    )
  }

  const st = statusLabels[consultation.status] || statusLabels.waiting

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full" asChild>
            <Link href="/consultations"><ArrowLeft className="size-5" /></Link>
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black">{consultation.consultationNumber}</h1>
              <Badge className={cn("rounded-full text-[10px] font-bold px-3 py-1 uppercase", st.className)}>{st.label}</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {typeLabels[consultation.consultationType] || consultation.consultationType} — {new Date(consultation.visitDate).toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
            </p>
          </div>
        </div>
      </div>

      {/* Patient & Doctor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className={cn(
              "size-14 rounded-full flex items-center justify-center text-lg font-black border-2",
              consultation.patient.gender === "Male" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-pink-500/10 text-pink-600 border-pink-500/20"
            )}>
              {consultation.patient.firstName.charAt(0)}{consultation.patient.lastName.charAt(0)}
            </div>
            <div className="flex-1">
              <p className="font-black text-lg">{consultation.patient.firstName} {consultation.patient.lastName}</p>
              <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                <span>#{consultation.patient.patientNumber}</span>
                <span>·</span>
                <span>{consultation.patient.gender === "Male" ? "Homme" : "Femme"}</span>
                <span>·</span>
                <span>{consultation.patient.phone}</span>
              </div>
            </div>
            <Button variant="outline" size="sm" className="rounded-full text-xs" asChild>
              <Link href={`/patients/${consultation.patient.id}`}>Voir le dossier</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-14 rounded-full bg-primary/10 flex items-center justify-center text-primary border-2 border-primary/20">
              <Stethoscope className="size-6" />
            </div>
            <div className="flex-1">
              <p className="font-black text-lg">Dr. {consultation.doctor.fullName || "N/A"}</p>
              <p className="text-xs text-muted-foreground mt-1">{consultation.doctor.specialty?.name || "Médecin traitant"}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="rounded-2xl bg-muted/50 p-1">
          <TabsTrigger value="overview" className="rounded-xl font-bold text-xs data-[state=active]:shadow-sm">Aperçu</TabsTrigger>
          <TabsTrigger value="vitals" className="rounded-xl font-bold text-xs data-[state=active]:shadow-sm">Signes Vitaux</TabsTrigger>
          <TabsTrigger value="diagnoses" className="rounded-xl font-bold text-xs data-[state=active]:shadow-sm">Diagnostics</TabsTrigger>
          <TabsTrigger value="prescriptions" className="rounded-xl font-bold text-xs data-[state=active]:shadow-sm">Prescriptions</TabsTrigger>
          <TabsTrigger value="exams" className="rounded-xl font-bold text-xs data-[state=active]:shadow-sm">Examens</TabsTrigger>
          <TabsTrigger value="decisions" className="rounded-xl font-bold text-xs data-[state=active]:shadow-sm">Décisions</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview" className="space-y-6">
          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black flex items-center gap-2"><FileText className="size-4 text-primary" /> Motif et Symptômes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {consultation.chiefComplaint && (
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Motif principal</p>
                  <p className="font-medium mt-1">{consultation.chiefComplaint}</p>
                </div>
              )}
              <div className="grid grid-cols-3 gap-4">
                {consultation.symptoms && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Symptômes</p>
                    <p className="font-medium mt-1">{consultation.symptoms}</p>
                  </div>
                )}
                {consultation.symptomsDuration && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Durée</p>
                    <p className="font-medium mt-1">{consultation.symptomsDuration}</p>
                  </div>
                )}
                {consultation.painLevel && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Douleur</p>
                    <p className="font-medium mt-1">{consultation.painLevel}/10</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {(consultation.medicalHistory || consultation.surgicalHistory || consultation.familyHistory || consultation.allergies) && (
            <Card className="rounded-2xl border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-black">Antécédents</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {consultation.medicalHistory && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Médicaux</p>
                    <p className="text-sm mt-1">{consultation.medicalHistory}</p>
                  </div>
                )}
                {consultation.surgicalHistory && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Chirurgicaux</p>
                    <p className="text-sm mt-1">{consultation.surgicalHistory}</p>
                  </div>
                )}
                {consultation.familyHistory && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Familiaux</p>
                    <p className="text-sm mt-1">{consultation.familyHistory}</p>
                  </div>
                )}
                {consultation.allergies && (
                  <div>
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Allergies</p>
                    <p className="text-sm mt-1">{consultation.allergies}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {consultation.notes && (
            <Card className="rounded-2xl border-none shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-black">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{consultation.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Vitals */}
        <TabsContent value="vitals">
          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black flex items-center gap-2"><Activity className="size-4 text-primary" /> Signes Vitaux</CardTitle>
            </CardHeader>
            <CardContent>
              {consultation.triage && consultation.triage.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  {consultation.triage[0].temperature && (
                    <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-center">
                      <Thermometer className="size-5 mx-auto text-orange-600 mb-1" />
                      <p className="text-2xl font-black text-orange-600">{consultation.triage[0].temperature}°C</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Température</p>
                    </div>
                  )}
                  {consultation.triage[0].bloodPressure && (
                    <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center">
                      <Heart className="size-5 mx-auto text-red-600 mb-1" />
                      <p className="text-2xl font-black text-red-600">{consultation.triage[0].bloodPressure}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Tension</p>
                    </div>
                  )}
                  {consultation.triage[0].heartRate && (
                    <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-center">
                      <Heart className="size-5 mx-auto text-blue-600 mb-1" />
                      <p className="text-2xl font-black text-blue-600">{consultation.triage[0].heartRate} <span className="text-sm font-bold">bpm</span></p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Pouls</p>
                    </div>
                  )}
                  {consultation.triage[0].respiratoryRate && (
                    <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 text-center">
                      <Wind className="size-5 mx-auto text-teal-600 mb-1" />
                      <p className="text-2xl font-black text-teal-600">{consultation.triage[0].respiratoryRate} <span className="text-sm font-bold">rpm</span></p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Respiration</p>
                    </div>
                  )}
                  {consultation.triage[0].oxygenSaturation && (
                    <div className="p-4 rounded-xl bg-cyan-50 border border-cyan-200 text-center">
                      <Wind className="size-5 mx-auto text-cyan-600 mb-1" />
                      <p className="text-2xl font-black text-cyan-600">{consultation.triage[0].oxygenSaturation}%</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">SpO₂</p>
                    </div>
                  )}
                  {consultation.triage[0].weight && (
                    <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 text-center">
                      <Weight className="size-5 mx-auto text-purple-600 mb-1" />
                      <p className="text-2xl font-black text-purple-600">{consultation.triage[0].weight} <span className="text-sm font-bold">kg</span></p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Poids</p>
                    </div>
                  )}
                  {consultation.triage[0].height && (
                    <div className="p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-center">
                      <Weight className="size-5 mx-auto text-indigo-600 mb-1" />
                      <p className="text-2xl font-black text-indigo-600">{consultation.triage[0].height} <span className="text-sm font-bold">cm</span></p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Taille</p>
                    </div>
                  )}
                  {consultation.triage[0].bmi && (
                    <div className="p-4 rounded-xl bg-pink-50 border border-pink-200 text-center">
                      <Activity className="size-5 mx-auto text-pink-600 mb-1" />
                      <p className="text-2xl font-black text-pink-600">{consultation.triage[0].bmi}</p>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">IMC</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-center text-muted-foreground italic py-8">Aucun signe vital enregistré</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Diagnoses */}
        <TabsContent value="diagnoses">
          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black flex items-center gap-2"><AlertTriangle className="size-4 text-primary" /> Diagnostics</CardTitle>
            </CardHeader>
            <CardContent>
              {consultation.diagnoses && consultation.diagnoses.length > 0 ? (
                <div className="space-y-3">
                  {consultation.diagnoses.map((d) => (
                    <div key={d.id} className="p-4 rounded-xl bg-muted/30 border">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="rounded-full text-[9px] font-bold uppercase px-2">
                          {d.diagnosisType}
                        </Badge>
                        {d.icdCode && (
                          <Badge variant="secondary" className="rounded font-mono text-[10px]">{d.icdCode}</Badge>
                        )}
                      </div>
                      <p className="font-bold">{d.diagnosisName || d.diagnosisCode || "Diagnostic"}</p>
                      {d.notes && <p className="text-sm text-muted-foreground mt-1">{d.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground italic py-8">Aucun diagnostic enregistré</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Prescriptions */}
        <TabsContent value="prescriptions">
          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black flex items-center gap-2"><Pill className="size-4 text-primary" /> Prescriptions</CardTitle>
            </CardHeader>
            <CardContent>
              {consultation.prescriptions && consultation.prescriptions.length > 0 ? (
                <div className="space-y-4">
                  {consultation.prescriptions.map((p) => (
                    <div key={p.id} className="p-4 rounded-xl bg-muted/30 border">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-muted-foreground">Prescrit par Dr. {p.doctor.fullName || "N/A"}</p>
                      </div>
                      {p.items.length > 0 ? (
                        <div className="space-y-2">
                          {p.items.map((item) => (
                            <div key={item.id} className="flex items-center justify-between p-2 rounded-lg bg-background border">
                              <div>
                                <p className="font-bold text-sm">{item.medicineName}</p>
                                <p className="text-xs text-muted-foreground">
                                  {[item.dosage, item.frequency, item.duration].filter(Boolean).join(" — ")}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground italic">Aucun médicament prescrit</p>
                      )}
                      {p.notes && <p className="text-xs text-muted-foreground mt-2 italic">{p.notes}</p>}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground italic py-8">Aucune prescription</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Exams */}
        <TabsContent value="exams">
          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black flex items-center gap-2"><Activity className="size-4 text-primary" /> Examens Demandés</CardTitle>
            </CardHeader>
            <CardContent>
              {consultation.examRequests && consultation.examRequests.length > 0 ? (
                <div className="space-y-3">
                  {consultation.examRequests.map((e) => (
                    <div key={e.id} className="p-4 rounded-xl bg-muted/30 border">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="rounded-full text-[9px] font-bold uppercase">
                            {e.examType === "lab" ? "Labo" : "Imagerie"}
                          </Badge>
                          <p className="font-bold">{e.examName}</p>
                        </div>
                        <Badge variant="outline" className={cn(
                          "rounded-full text-[9px] font-bold px-2",
                          e.status === "completed" ? "bg-green-500/10 text-green-600 border-green-200" :
                          e.status === "in_progress" ? "bg-blue-500/10 text-blue-600 border-blue-200" :
                          "bg-amber-500/10 text-amber-600 border-amber-200"
                        )}>
                          {e.status === "completed" ? "Fait" : e.status === "in_progress" ? "En cours" : "En attente"}
                        </Badge>
                      </div>
                      {e.results.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {e.results.map((r) => (
                            <div key={r.id} className="p-3 rounded-lg bg-background border text-sm">
                              {r.resultText}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground italic py-8">Aucun examen demandé</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Decisions */}
        <TabsContent value="decisions">
          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black flex items-center gap-2"><CheckCircle2 className="size-4 text-primary" /> Décisions Médicales</CardTitle>
            </CardHeader>
            <CardContent>
              {consultation.medicalDecisions && consultation.medicalDecisions.length > 0 ? (
                <div className="space-y-3">
                  {consultation.medicalDecisions.map((d) => (
                    <div key={d.id} className="p-4 rounded-xl bg-muted/30 border">
                      <div className="flex items-center gap-3">
                        <CheckCircle2 className="size-5 text-primary" />
                        <p className="font-bold">{decisionLabels[d.decision] || d.decision}</p>
                      </div>
                      {d.reason && <p className="text-sm text-muted-foreground mt-2">{d.reason}</p>}
                      {d.specialist && (
                        <p className="text-xs text-muted-foreground mt-1">Spécialiste: Dr. {d.specialist.fullName || "N/A"}</p>
                      )}
                      {d.followUpDate && (
                        <p className="text-xs text-muted-foreground mt-1">Suivi le {new Date(d.followUpDate).toLocaleDateString("fr-FR")}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground italic py-8">Aucune décision médicale</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
