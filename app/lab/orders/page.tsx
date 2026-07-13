"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Plus, Search, Loader2, FlaskConical, ArrowRight, Filter } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "pending", label: "En attente" },
  { value: "sample_collected", label: "Prélevé" },
  { value: "in_analysis", label: "En analyse" },
  { value: "results_entered", label: "Résultats saisis" },
  { value: "validated", label: "Validé" },
  { value: "cancelled", label: "Annulé" },
]

interface Order {
  id: string
  orderNumber: string
  status: string
  priority: string
  createdAt: string
  patient: { id: string; firstName: string; lastName: string }
  labTest: { id: string; code: string; name: string; testType: string }
  orderedBy: { id: string; fullName: string } | null
}

export default function LabOrdersPage() {
  const { user } = useCurrentUser()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState("all")
  const [patientSearch, setPatientSearch] = useState("")
  const [tests, setTests] = useState<any[]>([])
  const [patients, setPatients] = useState<any[]>([])
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    labTestId: "",
    patientId: "",
    priority: "normal",
    clinicalNotes: "",
    patientSearch: "",
  })

  useEffect(() => { fetchOrders() }, [statusFilter, patientSearch])

  useEffect(() => {
    if (createOpen) {
      fetch("/api/lab/tests?active=true").then(r => r.json()).then(d => { if (d.data) setTests(d.data) })
    }
  }, [createOpen])

  async function fetchOrders() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (patientSearch) params.set("patient", patientSearch)
      const res = await fetch(`/api/lab/orders?${params}`)
      const json = await res.json()
      if (res.ok) setOrders(json.data)
    } catch { toast.error("Erreur de chargement") }
    finally { setLoading(false) }
  }

  async function searchPatients(q: string) {
    setForm(f => ({ ...f, patientSearch: q }))
    if (q.length < 2) return
    setPatientsLoading(true)
    try {
      const res = await fetch(`/api/patients/list?search=${encodeURIComponent(q)}`)
      const json = await res.json()
      if (res.ok) setPatients(json.data || [])
    } catch {} finally { setPatientsLoading(false) }
  }

  async function handleCreate() {
    if (!form.labTestId || !form.patientId) return
    setSaving(true)
    try {
      const res = await fetch("/api/lab/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          labTestId: form.labTestId,
          patientId: form.patientId,
          orderedBy: user?.id,
          priority: form.priority,
          clinicalNotes: form.clinicalNotes || null,
        }),
      })
      if (res.ok) {
        toast.success("Demande créée")
        setCreateOpen(false)
        setForm({ labTestId: "", patientId: "", priority: "normal", clinicalNotes: "", patientSearch: "" })
        fetchOrders()
      } else {
        const err = await res.json()
        toast.error(err.error || "Erreur")
      }
    } catch { toast.error("Erreur réseau") }
    finally { setSaving(false) }
  }

  const statusColor = (s: string) => {
    const colors: Record<string, string> = {
      pending: "bg-amber-100 text-amber-700 border-amber-200",
      sample_collected: "bg-blue-100 text-blue-700 border-blue-200",
      in_analysis: "bg-violet-100 text-violet-700 border-violet-200",
      results_entered: "bg-emerald-100 text-emerald-700 border-emerald-200",
      validated: "bg-green-100 text-green-700 border-green-200",
      cancelled: "bg-red-100 text-red-700 border-red-200",
    }
    return colors[s] || ""
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Demandes de Laboratoire" description="Gérer les examens biologiques et leurs résultats">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
              <Plus className="size-4 mr-2" />Nouvelle Demande
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 bg-primary text-primary-foreground">
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Nouvelle Demande d'Examen</DialogTitle>
              <DialogDescription className="text-primary-foreground/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                Prescrire un test de laboratoire
              </DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Patient *</Label>
                <Input
                  placeholder="Rechercher un patient..."
                  className="h-11 rounded-2xl font-bold"
                  value={form.patientSearch}
                  onChange={(e) => searchPatients(e.target.value)}
                />
                {form.patientSearch && patients.length > 0 && !form.patientId && (
                  <div className="rounded-xl border bg-background max-h-40 overflow-y-auto">
                    {patients.map((p: any) => (
                      <button
                        key={p.id}
                        className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-muted transition-colors"
                        onClick={() => {
                          setForm(f => ({ ...f, patientId: p.id, patientSearch: `${p.firstName} ${p.lastName}` }))
                          setPatients([])
                        }}
                      >
                        {p.firstName} {p.lastName} {p.patientNumber && <span className="text-muted-foreground">#{p.patientNumber}</span>}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Test *</Label>
                <Select value={form.labTestId} onValueChange={v => setForm(f => ({ ...f, labTestId: v }))}>
                  <SelectTrigger className="h-11 rounded-2xl font-bold"><SelectValue placeholder="Choisir un test" /></SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {tests.map(t => (
                      <SelectItem key={t.id} value={t.id} className="font-bold">{t.name} ({t.code})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Priorité</Label>
                <Select value={form.priority} onValueChange={v => setForm(f => ({ ...f, priority: v }))}>
                  <SelectTrigger className="h-11 rounded-2xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    <SelectItem value="normal" className="font-bold">Normale</SelectItem>
                    <SelectItem value="urgent" className="font-bold text-amber-600">Urgente</SelectItem>
                    <SelectItem value="very_urgent" className="font-bold text-destructive">Très Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Notes Cliniques</Label>
                <Textarea
                  placeholder="Indications cliniques..."
                  className="rounded-2xl font-bold text-xs"
                  value={form.clinicalNotes}
                  onChange={e => setForm(f => ({ ...f, clinicalNotes: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="p-6 bg-muted/30 border-t border-muted/50 gap-3">
              <Button variant="ghost" className="rounded-full font-black uppercase text-[10px] tracking-widest" onClick={() => setCreateOpen(false)}>Annuler</Button>
              <Button className="rounded-full font-black uppercase text-[10px] tracking-widest" onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : "Créer la Demande"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un patient..."
            className="h-10 pl-10 rounded-full text-sm"
            value={patientSearch}
            onChange={e => setPatientSearch(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[200px] h-10 rounded-full font-bold text-xs"><Filter className="size-3 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent className="rounded-2xl">
            {STATUS_OPTIONS.map(o => (<SelectItem key={o.value} value={o.value} className="font-bold">{o.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-muted/50">
                <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-muted-foreground">N° Demande</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Patient</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Test</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Priorité</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Date</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Statut</TableHead>
                <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-muted-foreground"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="h-48 text-center"><Loader2 className="size-8 animate-spin mx-auto text-primary opacity-20" /></TableCell></TableRow>
              ) : orders.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-48 text-center text-muted-foreground font-bold italic opacity-30">Aucune demande trouvée</TableCell></TableRow>
              ) : orders.map((order) => (
                <TableRow key={order.id} className="border-muted/50 hover:bg-white/50 transition-colors">
                  <TableCell className="pl-8">
                    <Badge variant="outline" className="font-mono font-black text-[10px] bg-primary/5 border-primary/20">{order.orderNumber}</Badge>
                  </TableCell>
                  <TableCell className="font-bold text-sm">{order.patient?.firstName} {order.patient?.lastName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs">{order.labTest?.name}</span>
                      <span className="text-[9px] text-muted-foreground font-bold">{order.labTest?.code}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.priority === "very_urgent" ? (
                      <Badge className="bg-red-100 text-red-700 border-red-200 text-[8px] font-black uppercase tracking-widest">Très Urgent</Badge>
                    ) : order.priority === "urgent" ? (
                      <Badge className="bg-amber-100 text-amber-700 border-amber-200 text-[8px] font-black uppercase tracking-widest">Urgent</Badge>
                    ) : (
                      <span className="text-[10px] text-muted-foreground font-bold">Normale</span>
                    )}
                  </TableCell>
                  <TableCell className="text-[10px] font-bold text-muted-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-[8px] font-black uppercase tracking-widest border ${statusColor(order.status)}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-8 text-right">
                    <Link href={`/lab/orders/${order.id}`}>
                      <Button variant="ghost" size="icon" className="size-8 rounded-full">
                        <ArrowRight className="size-4" />
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
