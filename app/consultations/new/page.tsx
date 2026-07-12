"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Save, Loader2, Search, User, Stethoscope, Activity, Thermometer, Heart, Weight, Wind } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"

interface Patient {
  id: string
  patientNumber: number
  firstName: string
  lastName: string
  phone: string
  gender: string
}

interface Doctor {
  id: string
  fullName: string | null
  specialty: { id: string; name: string } | null
}

const consultationTypes = [
  { value: "general", label: "Générale" },
  { value: "pediatric", label: "Pédiatrique" },
  { value: "ophthalmology", label: "Ophtalmologique" },
  { value: "gynecology", label: "Gynécologique" },
]

export default function NewConsultationPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)

  const [patientSearch, setPatientSearch] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [showPatientResults, setShowPatientResults] = useState(false)

  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [selectedDoctorId, setSelectedDoctorId] = useState("")

  const [form, setForm] = useState({
    consultationType: "general",
    chiefComplaint: "",
    symptoms: "",
    symptomsDuration: "",
    painLevel: "",
    onsetDate: "",
    medicalHistory: "",
    surgicalHistory: "",
    familyHistory: "",
    allergies: "",
    currentMedications: "",
    notes: "",
  })

  const [triage, setTriage] = useState({
    temperature: "",
    bloodPressure: "",
    heartRate: "",
    respiratoryRate: "",
    oxygenSaturation: "",
    weight: "",
    height: "",
  })

  useEffect(() => {
    fetchDoctors()
  }, [])

  // Patient search
  useEffect(() => {
    if (patientSearch.length < 1) { setPatients([]); return }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/patients/list?search=${encodeURIComponent(patientSearch)}&limit=10`)
        const result = await res.json()
        if (result.data) setPatients(result.data)
      } catch (err) { /* silent */ }
    }, 300)
    return () => clearTimeout(timer)
  }, [patientSearch])

  async function fetchDoctors() {
    try {
      const res = await fetch("/api/doctors/list?active=true")
      const result = await res.json()
      if (result.success) setDoctors(result.data)
    } catch (err) { /* silent */ }
  }

  async function handleSubmit() {
    if (!selectedPatient || !selectedDoctorId) {
      toast.error("Veuillez sélectionner un patient et un médecin")
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        patientId: selectedPatient.id,
        doctorId: selectedDoctorId,
        ...form,
        ...triage,
      }
      const res = await fetch("/api/consultations/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const result = await res.json()
      if (result.success) {
        toast.success("Consultation créée avec succès")
        router.push(`/consultations/${result.data.id}`)
      } else {
        toast.error(result.error || "Erreur lors de la création")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6  mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" className="rounded-full" asChild>
          <Link href="/consultations"><ArrowLeft className="size-5" /></Link>
        </Button>
        <PageHeader title="Nouvelle Consultation" description="Enregistrer une nouvelle consultation médicale" />
      </div>

      <div className="grid gap-6">
        {/* Patient Selection */}
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <User className="size-4 text-primary" /> Patient
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPatient ? (
              <div className="flex items-center justify-between p-3 rounded-xl bg-primary/5 border border-primary/10">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black">
                    {selectedPatient.firstName.charAt(0)}{selectedPatient.lastName.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold">{selectedPatient.firstName} {selectedPatient.lastName}</p>
                    <p className="text-xs text-muted-foreground">#{selectedPatient.patientNumber} — {selectedPatient.phone}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="rounded-full text-xs" onClick={() => { setSelectedPatient(null); setPatientSearch("") }}>
                  Changer
                </Button>
              </div>
            ) : (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un patient par nom ou téléphone..."
                  className="pl-10 h-11 rounded-xl"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  onFocus={() => setShowPatientResults(true)}
                />
                {showPatientResults && patients.length > 0 && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl border bg-card shadow-xl overflow-hidden">
                    {patients.map((p) => (
                      <button
                        key={p.id}
                        className="flex w-full items-center gap-3 px-4 py-3 hover:bg-primary/5 transition-colors text-left"
                        onMouseDown={() => { setSelectedPatient(p); setPatientSearch(""); setShowPatientResults(false) }}
                      >
                        <div className="size-9 rounded-full bg-muted flex items-center justify-center text-xs font-black">
                          {p.firstName.charAt(0)}{p.lastName.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-sm">{p.firstName} {p.lastName}</p>
                          <p className="text-xs text-muted-foreground">#{p.patientNumber} — {p.phone}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doctor & Type */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Stethoscope className="size-4 text-primary" /> Médecin
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={selectedDoctorId} onValueChange={setSelectedDoctorId}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue placeholder="Sélectionner un médecin" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      Dr. {d.fullName || "N/A"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-black flex items-center gap-2">
                <Activity className="size-4 text-primary" /> Type de consultation
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={form.consultationType} onValueChange={(v) => setForm((f) => ({ ...f, consultationType: v }))}>
                <SelectTrigger className="h-11 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {consultationTypes.map((t) => (
                    <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </div>

        {/* Clinical Info */}
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black">Motif et Symptômes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">Motif principal</Label>
              <Input
                placeholder="Ex: Douleur abdominale, Fièvre..."
                className="rounded-xl h-11"
                value={form.chiefComplaint}
                onChange={(e) => setForm((f) => ({ ...f, chiefComplaint: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Symptômes</Label>
                <Input
                  placeholder="Ex: Nausées, Vertiges..."
                  className="rounded-xl h-11"
                  value={form.symptoms}
                  onChange={(e) => setForm((f) => ({ ...f, symptoms: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Durée</Label>
                <Input
                  placeholder="Ex: 3 jours"
                  className="rounded-xl h-11"
                  value={form.symptomsDuration}
                  onChange={(e) => setForm((f) => ({ ...f, symptomsDuration: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground">Niveau de douleur (1-10)</Label>
                <Input
                  type="number"
                  min="0"
                  max="10"
                  placeholder="0"
                  className="rounded-xl h-11"
                  value={form.painLevel}
                  onChange={(e) => setForm((f) => ({ ...f, painLevel: e.target.value }))}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Triage / Vitals */}
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black flex items-center gap-2">
              <Activity className="size-4 text-primary" /> Signes Vitaux (Triage)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Thermometer className="size-3" /> Température (°C)</Label>
                <Input type="number" step="0.1" placeholder="36.5" className="rounded-xl h-11" value={triage.temperature} onChange={(e) => setTriage((f) => ({ ...f, temperature: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Heart className="size-3" /> Tension (mmHg)</Label>
                <Input placeholder="120/80" className="rounded-xl h-11" value={triage.bloodPressure} onChange={(e) => setTriage((f) => ({ ...f, bloodPressure: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Heart className="size-3" /> Pouls (bpm)</Label>
                <Input type="number" placeholder="72" className="rounded-xl h-11" value={triage.heartRate} onChange={(e) => setTriage((f) => ({ ...f, heartRate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Wind className="size-3" /> Respiration (rpm)</Label>
                <Input type="number" placeholder="16" className="rounded-xl h-11" value={triage.respiratoryRate} onChange={(e) => setTriage((f) => ({ ...f, respiratoryRate: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Wind className="size-3" /> SpO₂ (%)</Label>
                <Input type="number" placeholder="98" className="rounded-xl h-11" value={triage.oxygenSaturation} onChange={(e) => setTriage((f) => ({ ...f, oxygenSaturation: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Weight className="size-3" /> Poids (kg)</Label>
                <Input type="number" step="0.1" placeholder="70" className="rounded-xl h-11" value={triage.weight} onChange={(e) => setTriage((f) => ({ ...f, weight: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground flex items-center gap-1"><Weight className="size-3" /> Taille (cm)</Label>
                <Input type="number" placeholder="170" className="rounded-xl h-11" value={triage.height} onChange={(e) => setTriage((f) => ({ ...f, height: e.target.value }))} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Medical History */}
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black">Antécédents</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">Antécédents médicaux</Label>
              <Textarea placeholder="Diabète, HTA, etc." className="rounded-xl min-h-[80px]" value={form.medicalHistory} onChange={(e) => setForm((f) => ({ ...f, medicalHistory: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">Antécédents chirurgicaux</Label>
              <Textarea placeholder="Appendicectomie, etc." className="rounded-xl min-h-[80px]" value={form.surgicalHistory} onChange={(e) => setForm((f) => ({ ...f, surgicalHistory: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">Antécédents familiaux</Label>
              <Textarea placeholder="..." className="rounded-xl min-h-[80px]" value={form.familyHistory} onChange={(e) => setForm((f) => ({ ...f, familyHistory: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground">Allergies</Label>
              <Textarea placeholder="Aucune" className="rounded-xl min-h-[80px]" value={form.allergies} onChange={(e) => setForm((f) => ({ ...f, allergies: e.target.value }))} />
            </div>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card className="rounded-2xl border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-black">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea placeholder="Notes complémentaires..." className="rounded-xl min-h-[100px]" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <Button variant="ghost" className="rounded-full font-bold" asChild>
            <Link href="/consultations">Annuler</Link>
          </Button>
          <Button
            className="rounded-full font-black px-8 shadow-lg"
            disabled={submitting || !selectedPatient || !selectedDoctorId}
            onClick={handleSubmit}
          >
            {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
            Enregistrer la Consultation
          </Button>
        </div>
      </div>
    </div>
  )
}
