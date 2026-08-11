"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Loader2, BedDouble, Pencil, Trash2 } from "lucide-react"
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
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"

const BED_TYPES = [
  { value: "standard", label: "Standard" },
  { value: "icu", label: "Soins Intensifs" },
  { value: "private", label: "Privé" },
]

const STATUS_LABELS: Record<string, string> = {
  available: "Disponible",
  occupied: "Occupé",
  maintenance: "Maintenance",
  reserved: "Réservé",
}

const STATUS_VARIANTS: Record<string, string> = {
  available: "default",
  occupied: "secondary",
  maintenance: "warning",
  reserved: "outline",
}

export default function BedsPage() {
  const [beds, setBeds] = useState<any[]>([])
  const [wards, setWards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [wardFilter, setWardFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [editBed, setEditBed] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [wardId, setWardId] = useState("")
  const [bedNumber, setBedNumber] = useState("")
  const [bedType, setBedType] = useState("standard")

  useEffect(() => { fetchBeds() }, [wardFilter, statusFilter])
  useEffect(() => { fetch("/api/hospital/wards?active=true").then(r => r.json()).then(d => { if (d.data) setWards(d.data) }) }, [])

  async function fetchBeds() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (wardFilter !== "all") params.set("wardId", wardFilter)
      if (statusFilter !== "all") params.set("status", statusFilter)
      const res = await fetch(`/api/hospital/beds?${params}`)
      const json = await res.json()
      if (res.ok) setBeds(json.data)
    } catch { toast.error("Erreur de chargement") }
    finally { setLoading(false) }
  }

  async function handleSave() {
    if (!wardId || !bedNumber.trim()) return
    setSaving(true)
    try {
      const url = editBed ? `/api/hospital/beds/${editBed.id}` : "/api/hospital/beds"
      const method = editBed ? "PATCH" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ wardId, bedNumber, bedType }) })
      if (res.ok) {
        toast.success(editBed ? "Lit modifié" : "Lit créé")
        setCreateOpen(false)
        setEditBed(null)
        setWardId("")
        setBedNumber("")
        setBedType("standard")
        fetchBeds()
      } else { const err = await res.json(); toast.error(err.error || "Erreur") }
    } catch { toast.error("Erreur réseau") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce lit ?")) return
    try {
      const res = await fetch(`/api/hospital/beds/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Lit supprimé"); fetchBeds() }
    } catch { toast.error("Erreur") }
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Gestion des Lits" description="Gérer les lits d'hospitalisation">
        <Dialog open={createOpen || !!editBed} onOpenChange={o => { setCreateOpen(o); if (!o) { setEditBed(null); setWardId(""); setBedNumber(""); setBedType("standard") } }}>
          <DialogTrigger asChild>
            <Button className="rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
              <Plus className="size-4 mr-2" />Nouveau Lit
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 bg-primary text-primary-foreground">
              <DialogTitle className="text-xl font-black uppercase">{editBed ? "Modifier le Lit" : "Nouveau Lit"}</DialogTitle>
            </DialogHeader>
            <div className="p-8 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Service *</Label>
                <Select value={wardId} onValueChange={setWardId}>
                  <SelectTrigger className="h-11 rounded-2xl font-bold"><SelectValue placeholder="Choisir un service" /></SelectTrigger>
                  <SelectContent className="rounded-2xl">
                    {wards.map(w => (
                      <SelectItem key={w.id} value={w.id} className="font-bold">{w.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Numéro de Lit *</Label>
                <Input className="h-11 rounded-2xl font-bold" value={bedNumber} onChange={e => setBedNumber(e.target.value)} placeholder="Ex: 101" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Type</Label>
                <Select value={bedType} onValueChange={setBedType}>
                  <SelectTrigger className="h-11 rounded-2xl font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-2xl">{BED_TYPES.map(t => (
                    <SelectItem key={t.value} value={t.value} className="font-bold">{t.label}</SelectItem>
                  ))}</SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="p-6 bg-muted/30 border-t border-muted/50 gap-3">
              <Button variant="ghost" className="rounded-full font-black uppercase text-[10px] tracking-widest" onClick={() => { setCreateOpen(false); setEditBed(null); setWardId(""); setBedNumber(""); setBedType("standard") }}>Annuler</Button>
              <Button className="rounded-full font-black uppercase text-[10px] tracking-widest" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : editBed ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="flex gap-3">
        <Select value={wardFilter} onValueChange={setWardFilter}>
          <SelectTrigger className="w-[200px] h-10 rounded-full font-bold text-xs"><SelectValue placeholder="Service" /></SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="all" className="font-bold">Tous les services</SelectItem>
            {wards.map(w => (<SelectItem key={w.id} value={w.id} className="font-bold">{w.name}</SelectItem>))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] h-10 rounded-full font-bold text-xs"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="all" className="font-bold">Tous</SelectItem>
            <SelectItem value="available" className="font-bold">Disponibles</SelectItem>
            <SelectItem value="occupied" className="font-bold">Occupés</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-muted/50">
                <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-muted-foreground">Lit</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Service</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Type</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Statut</TableHead>
                <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="h-48 text-center"><Loader2 className="size-8 animate-spin mx-auto text-primary opacity-20" /></TableCell></TableRow>
              ) : beds.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground font-bold italic opacity-30">Aucun lit</TableCell></TableRow>
              ) : beds.map((b) => (
                <TableRow key={b.id} className="border-muted/50 hover:bg-white/50 transition-colors">
                  <TableCell className="pl-8 font-black text-sm">Lit {b.bedNumber}</TableCell>
                  <TableCell className="font-bold text-xs text-muted-foreground">{b.wardName || "—"}</TableCell>
                  <TableCell className="font-bold text-xs">{BED_TYPES.find(t => t.value === b.bedType)?.label || b.bedType || "Standard"}</TableCell>
                  <TableCell><Badge variant={(STATUS_VARIANTS[b.status] || "secondary") as any} className="text-[9px] font-black uppercase tracking-widest">{STATUS_LABELS[b.status] || b.status}</Badge></TableCell>
                  <TableCell className="pr-8 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={() => { setEditBed(b); setWardId(b.wardId); setBedNumber(b.bedNumber); setBedType(b.bedType || "standard") }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 rounded-full text-destructive" onClick={() => handleDelete(b.id)}>
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
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
