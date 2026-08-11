"use client"

import { useState, useEffect } from "react"
import { Plus, Search, Loader2, DoorOpen, BedDouble, Pencil, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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

export default function WardsPage() {
  const [wards, setWards] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)
  const [editWard, setEditWard] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState("")
  const [floor, setFloor] = useState("")

  useEffect(() => { fetchWards() }, [])

  async function fetchWards() {
    setLoading(true)
    try {
      const res = await fetch("/api/hospital/wards")
      const json = await res.json()
      if (res.ok) setWards(json.data)
    } catch { toast.error("Erreur de chargement") }
    finally { setLoading(false) }
  }

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      const url = editWard ? `/api/hospital/wards/${editWard.id}` : "/api/hospital/wards"
      const method = editWard ? "PATCH" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, floor }) })
      if (res.ok) {
        toast.success(editWard ? "Service modifié" : "Service créé")
        setCreateOpen(false)
        setEditWard(null)
        setName("")
        setFloor("")
        fetchWards()
      } else { const err = await res.json(); toast.error(err.error || "Erreur") }
    } catch { toast.error("Erreur réseau") }
    finally { setSaving(false) }
  }

  async function handleDelete(id: string) {
    if (!confirm("Supprimer ce service ?")) return
    try {
      const res = await fetch(`/api/hospital/wards/${id}`, { method: "DELETE" })
      if (res.ok) { toast.success("Service supprimé"); fetchWards() }
    } catch { toast.error("Erreur") }
  }

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Services d'Hospitalisation" description="Gérer les services (Maternité, Pédiatrie, Chirurgie...)">
        <Dialog open={createOpen || !!editWard} onOpenChange={o => { setCreateOpen(o); if (!o) { setEditWard(null); setName(""); setFloor("") } }}>
          <DialogTrigger asChild>
            <Button className="rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
              <Plus className="size-4 mr-2" />Nouveau Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 bg-primary text-primary-foreground">
              <DialogTitle className="text-xl font-black uppercase">{editWard ? "Modifier le Service" : "Nouveau Service"}</DialogTitle>
            </DialogHeader>
            <div className="p-8 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nom *</Label>
                <Input className="h-11 rounded-2xl font-bold" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Maternité" />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Étage</Label>
                <Input className="h-11 rounded-2xl font-bold" value={floor} onChange={e => setFloor(e.target.value)} placeholder="Ex: RDC, 1er étage..." />
              </div>
            </div>
            <DialogFooter className="p-6 bg-muted/30 border-t border-muted/50 gap-3">
              <Button variant="ghost" className="rounded-full font-black uppercase text-[10px] tracking-widest" onClick={() => { setCreateOpen(false); setEditWard(null); setName(""); setFloor("") }}>Annuler</Button>
              <Button className="rounded-full font-black uppercase text-[10px] tracking-widest" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : editWard ? "Modifier" : "Créer"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-muted/50">
                <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-muted-foreground">Nom</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Étage</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Lits</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Statut</TableHead>
                <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="h-48 text-center"><Loader2 className="size-8 animate-spin mx-auto text-primary opacity-20" /></TableCell></TableRow>
              ) : wards.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground font-bold italic opacity-30">Aucun service</TableCell></TableRow>
              ) : wards.map((w) => (
                <TableRow key={w.id} className="border-muted/50 hover:bg-white/50 transition-colors">
                  <TableCell className="pl-8 font-black text-sm">{w.name}</TableCell>
                  <TableCell className="font-bold text-xs text-muted-foreground">{w.floor || "—"}</TableCell>
                  <TableCell className="font-bold text-xs">{w.bedCount || 0}</TableCell>
                  <TableCell><Badge variant={w.isActive ? "default" : "secondary"} className="text-[9px] font-black uppercase tracking-widest">{w.isActive ? "Actif" : "Inactif"}</Badge></TableCell>
                  <TableCell className="pr-8 text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={() => { setEditWard(w); setName(w.name); setFloor(w.floor || "") }}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="size-8 rounded-full text-destructive" onClick={() => handleDelete(w.id)}>
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
