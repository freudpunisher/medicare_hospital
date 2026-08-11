"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Loader2, Hospital, ArrowRight, Calendar, Users, BedDouble } from "lucide-react"
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
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import Link from "next/link"
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

export default function AdmissionsPage() {
  const [admissions, setAdmissions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [patients, setPatients] = useState<any[]>([])
  const [wards, setWards] = useState<any[]>([])
  const [beds, setBeds] = useState<any[]>([])
  const [patientSearch, setPatientSearch] = useState("")

  const [form, setForm] = useState({
    patientId: "",
    wardId: "",
    bedId: "",
    reason: "",
  })

  useEffect(() => { fetchAdmissions() }, [search, statusFilter])

  useEffect(() => {
    if (!createOpen) return
    fetch("/api/hospital/wards?active=true").then(r => r.json()).then(d => { if (d.data) setWards(d.data) })
  }, [createOpen])

  useEffect(() => {
    if (form.wardId) {
      fetch(`/api/hospital/beds?wardId=${form.wardId}&status=available`).then(r => r.json()).then(d => { if (d.data) setBeds(d.data) })
    }
  }, [form.wardId])

  async function fetchAdmissions() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (search) params.set("search", search)
      const res = await fetch(`/api/hospital/admissions?${params}`)
      const json = await res.json()
      if (res.ok) setAdmissions(json.data)
    } catch { toast.error("Erreur de chargement") }
    finally { setLoading(false) }
  }

  async function searchPatients(q: string) {
    setPatientSearch(q)
    if (q.length < 2) return
    try {
      const res = await fetch(`/api/patients/list?search=${encodeURIComponent(q)}`)
      const json = await res.json()
      if (res.ok) setPatients(json.data || [])
    } catch {}
  }

  async function handleCreate() {
    if (!form.patientId || !form.bedId || !form.reason) {
      toast.error("Patient, lit et motif requis")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/hospital/admissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success("Patient admis")
        setCreateOpen(false)
        setForm({ patientId: "", wardId: "", bedId: "", reason: "" })
        fetchAdmissions()
      } else {
        const err = await res.json()
        toast.error(err.error || "Erreur")
      }
    } catch { toast.error("Erreur réseau") }
    finally { setSaving(false) }
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Admissions" description="Gérer les hospitalisations">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
              <Plus className="size-4 mr-2" />Nouvelle Admission
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 bg-primary text-primary-foreground">
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Nouvelle Admission</DialogTitle>
              <DialogDescription className="text-primary-foreground/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                Hospitaliser un patient
              </DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Patient *</Label>
                <Input placeholder="Rechercher un patient..." value={patientSearch} onChange={e => searchPatients(e.target.value)} className="h-11 rounded-2xl font-bold" />
                {patientSearch && patients.length > 0 && !form.patientId && (
                  <div className="border rounded-2xl overflow-hidden max-h-40 overflow-y-auto">
                    {patients.map(p => (
                      <div key={p.id} className="p-3 hover:bg-muted/50 cursor-pointer font-bold text-sm border-b last:border-0" onClick={() => { setForm(f => ({ ...f, patientId: p.id })); setPatientSearch(`${p.firstName} ${p.lastName}`) }}>
                        {p.firstName} {p.lastName} {p.patientNumber && <span className="text-muted-foreground font-mono text-[10px]">({p.patientNumber})</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Service *</Label>
                <Select value={form.wardId} onValueChange={v => setForm(f => ({ ...f, wardId: v, bedId: "" }))}>
                  <SelectTrigger className="h-11 rounded-2xl font-bold"><SelectValue placeholder="Choisir un service" /></SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {wards.map(w => (
                      <SelectItem key={w.id} value={w.id} className="font-bold">{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Lit *</Label>
                <Select value={form.bedId} onValueChange={v => setForm(f => ({ ...f, bedId: v }))} disabled={!form.wardId}>
                  <SelectTrigger className="h-11 rounded-2xl font-bold"><SelectValue placeholder={form.wardId ? "Choisir un lit" : "Sélectionnez d'abord un service"} /></SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {beds.map(b => (
                      <SelectItem key={b.id} value={b.id} className="font-bold">Lit {b.bedNumber} {b.bedType ? `(${b.bedType === "icu" ? "Soins Intensifs" : b.bedType === "private" ? "Privé" : "Standard"})` : ""}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Motif d&apos;hospitalisation *</Label>
                <Textarea placeholder="Motif de l'admission..." className="rounded-2xl font-bold text-xs" value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))} />
              </div>
            </div>
            <DialogFooter className="p-6 bg-muted/30 border-t border-muted/50 gap-3">
              <Button variant="ghost" className="rounded-full font-black uppercase text-[10px] tracking-widest" onClick={() => setCreateOpen(false)}>Annuler</Button>
              <Button className="rounded-full font-black uppercase text-[10px] tracking-widest" onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : "Admettre le Patient"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Rechercher un patient..." className="h-10 pl-10 rounded-full text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-10 rounded-full font-bold text-xs"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="all" className="font-bold">Tous</SelectItem>
            <SelectItem value="admitted" className="font-bold">Hospitalisés</SelectItem>
            <SelectItem value="discharged" className="font-bold">Sortis</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-muted/50">
                <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-muted-foreground">Patient</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Service</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Lit</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Admission</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Statut</TableHead>
                <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-48 text-center"><Loader2 className="size-8 animate-spin mx-auto text-primary opacity-20" /></TableCell></TableRow>
              ) : admissions.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="h-48 text-center text-muted-foreground font-bold italic opacity-30">Aucune admission</TableCell></TableRow>
              ) : admissions.map((a) => (
                <TableRow key={a.id} className="border-muted/50 hover:bg-white/50 transition-colors">
                  <TableCell className="pl-8 font-black text-sm">{a.patientName}</TableCell>
                  <TableCell className="font-bold text-xs">{a.wardName || "—"}</TableCell>
                  <TableCell className="font-bold text-xs">{a.bedNumber || "—"}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">{a.admissionDate ? format(new Date(a.admissionDate), "dd MMM yyyy", { locale: fr }) : "—"}</TableCell>
                  <TableCell><Badge variant={(STATUS_VARIANTS[a.status] || "secondary") as any} className="text-[9px] font-black uppercase tracking-widest">{STATUS_LABELS[a.status] || a.status}</Badge></TableCell>
                  <TableCell className="pr-8 text-right">
                    <Link href={`/hospital/admissions/${a.id}`}>
                      <Button variant="ghost" size="icon" className="size-8 rounded-full"><ArrowRight className="size-4" /></Button>
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
