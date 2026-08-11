"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Loader2, Hospital, ArrowLeft, User, BedDouble, DoorOpen, Calendar, FileText } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

const STATUS_LABELS: Record<string, string> = {
  admitted: "Hospitalisé",
  discharged: "Sorti",
  transferred: "Transféré",
}

const STATUS_VARIANTS: Record<string, string> = {
  admitted: "default",
  discharged: "secondary",
  transferred: "warning",
}

export default function AdmissionDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [admission, setAdmission] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [discharging, setDischarging] = useState(false)
  const [dischargeSummary, setDischargeSummary] = useState("")

  useEffect(() => { fetchAdmission() }, [id])

  async function fetchAdmission() {
    setLoading(true)
    try {
      const res = await fetch(`/api/hospital/admissions/${id}`)
      const json = await res.json()
      if (res.ok) setAdmission(json.data)
      else { toast.error("Admission introuvable"); router.push("/hospital/admissions") }
    } catch { toast.error("Erreur de chargement") }
    finally { setLoading(false) }
  }

  async function handleDischarge() {
    if (!confirm("Confirmer la sortie de ce patient ?")) return
    setDischarging(true)
    try {
      const res = await fetch(`/api/hospital/admissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "discharged", dischargeSummary: dischargeSummary || null }),
      })
      if (res.ok) {
        toast.success("Patient sorti")
        fetchAdmission()
      } else { const err = await res.json(); toast.error(err.error || "Erreur") }
    } catch { toast.error("Erreur réseau") }
    finally { setDischarging(false) }
  }

  if (loading) return <div className="p-6"><Loader2 className="size-8 animate-spin mx-auto text-primary/30" /></div>
  if (!admission) return null

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title={admission.patientName} description="Détails de l'hospitalisation">
        <div className="flex gap-2">
          <Button variant="ghost" className="rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest" onClick={() => router.push("/hospital/admissions")}>
            <ArrowLeft className="size-4 mr-2" />Retour
          </Button>
          {admission.status === "admitted" && (
            <Button className="rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest" onClick={handleDischarge} disabled={discharging}>
              {discharging ? <Loader2 className="size-4 animate-spin mr-2" /> : "Sortie du Patient"}
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Informations</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="size-4 text-muted-foreground" />
                <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Patient</p><p className="font-black">{admission.patientName}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <Hospital className="size-4 text-muted-foreground" />
                <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Statut</p><Badge variant={(STATUS_VARIANTS[admission.status] || "secondary") as any} className="text-[9px] font-black uppercase tracking-widest">{STATUS_LABELS[admission.status] || admission.status}</Badge></div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="size-4 text-muted-foreground" />
                <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Admission</p><p className="font-bold text-sm">{format(new Date(admission.admissionDate), "dd MMM yyyy HH:mm", { locale: fr })}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Lit</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <DoorOpen className="size-4 text-muted-foreground" />
                <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Service</p><p className="font-black">{admission.wardName || "—"}</p></div>
              </div>
              <div className="flex items-center gap-3">
                <BedDouble className="size-4 text-muted-foreground" />
                <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Lit</p><p className="font-black">Lit {admission.bedNumber || "—"}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Médecin</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <User className="size-4 text-muted-foreground" />
                <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Médecin traitant</p><p className="font-black">{admission.doctorName || "Non assigné"}</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-2xl border-none shadow-sm">
        <CardContent className="p-6 space-y-4">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Motif d&apos;hospitalisation</h3>
          <p className="text-sm font-medium">{admission.reason || "—"}</p>
        </CardContent>
      </Card>

      {admission.status === "discharged" && (
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sortie</h3>
            <div className="space-y-2">
              <p className="text-sm font-medium">
                <span className="text-muted-foreground">Date de sortie: </span>
                {admission.dischargeDate ? format(new Date(admission.dischargeDate), "dd MMM yyyy HH:mm", { locale: fr }) : "—"}
              </p>
              {admission.dischargeSummary && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Résumé de sortie</p>
                  <p className="text-sm font-medium whitespace-pre-wrap">{admission.dischargeSummary}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {admission.status === "admitted" && (
        <Card className="rounded-2xl border-none shadow-sm">
          <CardContent className="p-6 space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Résumé de Sortie</h3>
            <textarea
              className="w-full min-h-[120px] rounded-2xl border p-4 text-sm font-bold bg-background resize-none"
              placeholder="Notes de sortie, traitements prescrits, suivi recommandé..."
              value={dischargeSummary}
              onChange={e => setDischargeSummary(e.target.value)}
            />
            <Button className="rounded-full font-black uppercase text-[10px] tracking-widest" onClick={handleDischarge} disabled={discharging}>
              {discharging ? <Loader2 className="size-4 animate-spin mr-2" /> : "Confirmer la Sortie"}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
