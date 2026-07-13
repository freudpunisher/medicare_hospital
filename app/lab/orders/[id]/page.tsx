"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { ArrowLeft, FlaskConical, Loader2, CheckCircle2, User, Calendar, AlertCircle, Syringe, Save, FileCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { useCurrentUser } from "@/hooks/use-current-user"

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  sample_collected: "Prélevé",
  in_analysis: "En analyse",
  results_entered: "Résultats saisis",
  validated: "Validé",
  cancelled: "Annulé",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  sample_collected: "bg-blue-100 text-blue-700 border-blue-200",
  in_analysis: "bg-violet-100 text-violet-700 border-violet-200",
  results_entered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  validated: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
}

export default function LabOrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useCurrentUser()
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState<"info" | "results">("info")
  const [resultNotes, setResultNotes] = useState("")
  const [values, setValues] = useState<Record<string, { value: string; comment: string }>>({})

  useEffect(() => { if (id) fetchOrder() }, [id])

  async function fetchOrder() {
    setLoading(true)
    try {
      const res = await fetch(`/api/lab/orders/${id}`)
      const json = await res.json()
      if (res.ok) {
        setOrder(json.data)
        // Pre-populate values from existing results
        if (json.data.result) {
          const existing: Record<string, any> = {}
          for (const v of json.data.result.values) {
            existing[v.labTestParameterId] = { value: v.value, comment: v.comment || "" }
          }
          setValues(existing)
          setResultNotes(json.data.result.notes || "")
        }
      } else {
        toast.error("Demande introuvable")
        router.push("/lab/orders")
      }
    } catch { toast.error("Erreur de chargement") }
    finally { setLoading(false) }
  }

  async function handleUpdateStatus(newStatus: string) {
    try {
      const res = await fetch(`/api/lab/orders/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: newStatus,
          sampledBy: newStatus === "sample_collected" ? user?.id : undefined,
        }),
      })
      if (res.ok) {
        toast.success("Statut mis à jour")
        fetchOrder()
      }
    } catch { toast.error("Erreur") }
  }

  async function handleSubmitResults() {
    if (!order || !user?.id) return
    const params = order.labTest?.parameters
    if (!params || params.length === 0) {
      toast.error("Ce test n'a pas de paramètres définis")
      return
    }

    setSaving(true)
    try {
      const payload = {
        recordedBy: user.id,
        notes: resultNotes || null,
        values: params.map((p: any) => ({
          labTestParameterId: p.id,
          value: values[p.id]?.value || "",
          comment: values[p.id]?.comment || null,
          unit: p.unit,
        })),
      }

      const res = await fetch(`/api/lab/orders/${id}/results`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        toast.success("Résultats enregistrés")
        fetchOrder()
      } else {
        const err = await res.json()
        toast.error(err.error || "Erreur")
      }
    } catch { toast.error("Erreur réseau") }
    finally { setSaving(false) }
  }

  if (loading) {
    return <div className="p-20 text-center"><Loader2 className="size-10 animate-spin mx-auto text-primary opacity-30" /></div>
  }

  if (!order) return null

  const parameters = order.labTest?.parameters || []
  const hasResults = order.status === "results_entered" || order.status === "validated"

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <PageHeader
        title={order.labTest?.name || "Demande"}
        description={
          <div className="flex items-center gap-2 text-sm font-bold">
            <span>{order.patient?.firstName} {order.patient?.lastName}</span>
            <span className="text-muted-foreground">•</span>
            <span className="font-mono text-xs">{order.orderNumber}</span>
          </div>
        }
      >
        <Button variant="outline" className="rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest" onClick={() => router.push("/lab/orders")}>
          <ArrowLeft className="size-4 mr-2" />Retour
        </Button>
      </PageHeader>

      {/* Status + Actions */}
      <div className="flex items-center justify-between p-4 rounded-2xl bg-muted/30">
        <div className="flex items-center gap-3">
          <Badge className={`text-[10px] font-black uppercase tracking-widest border px-4 py-1.5 ${STATUS_COLORS[order.status]}`}>
            {STATUS_LABELS[order.status] || order.status}
          </Badge>
          <span className="text-xs text-muted-foreground font-bold">
            Créée le {new Date(order.createdAt).toLocaleDateString()} à {new Date(order.createdAt).toLocaleTimeString()}
          </span>
        </div>
        <div className="flex gap-2">
          {order.status === "pending" && (
            <Button size="sm" className="rounded-full h-8 px-4 text-[9px] font-black uppercase tracking-widest" onClick={() => handleUpdateStatus("sample_collected")}>
              <Syringe className="size-3 mr-1" />Prélèvement Effectué
            </Button>
          )}
          {order.status === "sample_collected" && (
            <Button size="sm" className="rounded-full h-8 px-4 text-[9px] font-black uppercase tracking-widest bg-violet-600 hover:bg-violet-700" onClick={() => handleUpdateStatus("in_analysis")}>
              <FlaskConical className="size-3 mr-1" />Lancer l'Analyse
            </Button>
          )}
          {(order.status === "results_entered" || order.status === "in_analysis") && !hasResults && (
            <Button size="sm" className="rounded-full h-8 px-4 text-[9px] font-black uppercase tracking-widest" onClick={() => setTab("results")}>
              <FileCheck className="size-3 mr-1" />Saisir Résultats
            </Button>
          )}
          {order.status === "results_entered" && (
            <Button size="sm" className="rounded-full h-8 px-4 text-[9px] font-black uppercase tracking-widest bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus("validated")}>
              <CheckCircle2 className="size-3 mr-1" />Valider
            </Button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-2xl bg-muted/30 w-fit">
        <button className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${tab === "info" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setTab("info")}>
          Informations
        </button>
        <button className={`px-5 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${tab === "results" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`} onClick={() => setTab("results")}>
          Résultats {hasResults && `(${order.result?.values?.length || 0})`}
        </button>
      </div>

      {tab === "info" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="rounded-[2rem] border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-black uppercase tracking-widest">Patient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground font-bold">Nom</span><span className="font-black">{order.patient?.firstName} {order.patient?.lastName}</span></div>
              {order.patient?.gender && <div className="flex justify-between text-sm"><span className="text-muted-foreground font-bold">Sexe</span><span className="font-black">{order.patient.gender === "M" ? "Masculin" : "Féminin"}</span></div>}
              {order.patient?.dateOfBirth && <div className="flex justify-between text-sm"><span className="text-muted-foreground font-bold">Né(e) le</span><span className="font-black">{new Date(order.patient.dateOfBirth).toLocaleDateString()}</span></div>}
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-black uppercase tracking-widest">Demande</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground font-bold">Test</span><span className="font-black">{order.labTest?.name}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground font-bold">N° Demande</span><span className="font-mono font-black">{order.orderNumber}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground font-bold">Prescrit par</span><span className="font-black">{order.orderer?.fullName || "—"}</span></div>
              {order.clinicalNotes && (
                <div className="pt-2">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Notes Cliniques</p>
                  <p className="text-sm font-medium bg-muted/30 p-3 rounded-xl">{order.clinicalNotes}</p>
                </div>
              )}
              {order.sampledAt && (
                <div className="flex justify-between text-sm"><span className="text-muted-foreground font-bold">Prélevé le</span><span className="font-black">{new Date(order.sampledAt).toLocaleString()}</span></div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {tab === "results" && (
        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-black uppercase tracking-widest">Saisie des Résultats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {parameters.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">Ce test n'a pas de paramètres définis. Ajoutez-en dans le catalogue.</p>
            ) : (
              <div className="space-y-4">
                {parameters.map((param: any) => (
                  <div key={param.id} className="p-4 rounded-2xl bg-muted/20 border">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-black">{param.parameterName}</p>
                        <p className="text-[10px] text-muted-foreground font-bold">{param.parameterCode} • {param.unit}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[9px] font-black uppercase text-muted-foreground">Référence</p>
                        {param.referenceRangeText ? (
                          <p className="text-[10px] font-bold text-muted-foreground">{param.referenceRangeText}</p>
                        ) : (
                          <p className="text-[10px] font-bold text-muted-foreground">
                            {param.referenceRangeLow || "—"} — {param.referenceRangeHigh || "—"} {param.unit}
                          </p>
                        )}
                        {(param.maleRefRangeLow || param.femaleRefRangeLow) && (
                          <p className="text-[8px] text-muted-foreground">
                            H: {param.maleRefRangeLow || "—"}-{param.maleRefRangeHigh || "—"} | F: {param.femaleRefRangeLow || "—"}-{param.femaleRefRangeHigh || "—"}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="flex-1">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Valeur</Label>
                        <Input
                          className="h-10 rounded-xl font-bold text-sm"
                          placeholder="Saisir la valeur..."
                          value={values[param.id]?.value ?? ""}
                          onChange={e => setValues(v => ({ ...v, [param.id]: { ...v[param.id], value: e.target.value, comment: v[param.id]?.comment || "" } }))}
                          readOnly={hasResults}
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Commentaire</Label>
                        <Input
                          className="h-10 rounded-xl font-bold text-sm"
                          placeholder="Optionnel..."
                          value={values[param.id]?.comment ?? ""}
                          onChange={e => setValues(v => ({ ...v, [param.id]: { value: v[param.id]?.value ?? "", comment: e.target.value } }))}
                          readOnly={hasResults}
                        />
                      </div>
                    </div>
                    {hasResults && order.result?.values?.find((rv: any) => rv.labTestParameterId === param.id)?.interpretation && (
                      <div className="mt-2">
                        <Badge variant="outline" className={
                          order.result.values.find((rv: any) => rv.labTestParameterId === param.id)?.interpretation === "normal"
                            ? "bg-green-100 text-green-700 border-green-200"
                            : order.result.values.find((rv: any) => rv.labTestParameterId === param.id)?.interpretation?.includes("critical")
                            ? "bg-red-100 text-red-700 border-red-200"
                            : "bg-amber-100 text-amber-700 border-amber-200"
                        }>
                          {order.result.values.find((rv: any) => rv.labTestParameterId === param.id)?.interpretation}
                        </Badge>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Notes du laboratoire</Label>
              <Textarea
                className="rounded-2xl font-bold text-xs"
                placeholder="Observations sur les résultats..."
                value={resultNotes}
                onChange={e => setResultNotes(e.target.value)}
                readOnly={hasResults}
              />
            </div>

            {!hasResults && parameters.length > 0 && (
              <Button
                className="rounded-full h-12 px-8 font-black uppercase text-[10px] tracking-widest shadow-xl w-full"
                onClick={handleSubmitResults}
                disabled={saving}
              >
                {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                Enregistrer les Résultats
              </Button>
            )}

            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <User className="size-3" />
              <span className="font-bold">
                {hasResults
                  ? `Enregistré par ${order.result?.recordedByUser?.fullName || "—"} le ${new Date(order.result?.recordedAt).toLocaleString()}`
                  : "Résultats non encore saisis"}
              </span>
              {order.result?.isVerified && (
                <>
                  <CheckCircle2 className="size-3 text-green-600" />
                  <span className="font-bold text-green-600">Validé par {order.result?.verifier?.fullName || "—"}</span>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
