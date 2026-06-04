"use client"

import { useEffect, useState, useMemo } from "react"
import { Plus, Power, PowerOff, Loader2, ShieldCheck, Mail, Phone, Edit2, Search, Building2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Insurance {
  id: string
  name: string
  contactInfo: string | null
  email: string | null
  phone: string | null
  isActive: boolean
}

export default function InsurancesPage() {
  const [data, setData] = useState<Insurance[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState("")

  const [form, setForm] = useState({
    name: "",
    contactInfo: "",
    email: "",
    phone: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch("/api/insurances/list")
      const result = await res.json()
      if (result.success) {
        setData(result.data)
      } else {
        toast.error("Erreur lors du chargement des assurances")
      }
    } catch (err) {
      toast.error("Impossible de se connecter au serveur")
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setForm({ name: "", contactInfo: "", email: "", phone: "" })
    setEditingId(null)
  }

  function handleEditClick(item: Insurance) {
    setEditingId(item.id)
    setForm({
      name: item.name,
      contactInfo: item.contactInfo || "",
      email: item.email || "",
      phone: item.phone || "",
    })
    setOpen(true)
  }

  async function handleSubmit() {
    if (!form.name) return
    setSubmitting(true)
    try {
      const url = editingId ? `/api/insurances/${editingId}` : "/api/insurances/create"
      const method = editingId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success(editingId ? "Assurance mise à jour" : "Nouvelle assurance ajoutée")
        setOpen(false)
        resetForm()
        fetchData()
      } else {
        toast.error(result.error || "Erreur lors de l'enregistrement")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleStatus(item: Insurance) {
    try {
      const res = await fetch(`/api/insurances/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success(`Statut mis à jour`)
        setData(prev => prev.map(i => i.id === item.id ? { ...i, isActive: !item.isActive } : i))
      } else {
        toast.error(result.error || "Erreur lors de la modification")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    }
  }

  const filteredData = useMemo(() => {
    return data.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.contactInfo && item.contactInfo.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.email && item.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.phone && item.phone.toLowerCase().includes(searchTerm.toLowerCase()))
    )
  }, [data, searchTerm])

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Assurances Partenaires" description="Gérer les assureurs et les conventions de tiers-payant">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full shadow-md px-5 font-bold">
              <Plus className="size-4 mr-2" />
              Nouvel Assureur
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] border-none shadow-2xl backdrop-blur-xl bg-card/95 sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">{editingId ? "Modifier l'Assureur" : "Ajouter un Assureur"}</DialogTitle>
              <DialogDescription>Configurez les informations du partenaire d'assurance.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6 border-y border-muted/20 my-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Nom de l'institution</Label>
                  <Input
                    placeholder="ex: MUTELLE, COGERIE, JUBILEE..."
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20 font-black h-12"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Email (Tiers-Payant)</Label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
                    <Input
                      type="email"
                      placeholder="contact@assurance.bi"
                      className="pl-11 rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                      value={form.email}
                      onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Téléphone Direct</Label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
                    <Input
                      placeholder="+257 ..."
                      className="pl-11 rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Adresse ou Notes Additionnelles</Label>
                  <Input
                    placeholder="Siège social, Service convention..."
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.contactInfo}
                    onChange={(e) => setForm((f) => ({ ...f, contactInfo: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => { setOpen(false); resetForm(); }} className="rounded-full font-bold">Annuler</Button>
              <Button onClick={handleSubmit} disabled={submitting || !form.name} className="rounded-full font-black px-8 shadow-lg">
                {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : (editingId ? <Edit2 className="size-4 mr-2" /> : <Plus className="size-4 mr-2" />)}
                {editingId ? "Enregistrer les modifications" : "Ajouter le Partenaire"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 bg-card/40 p-3 rounded-[2rem] border border-muted/20 backdrop-blur-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
          <Input
            placeholder="Rechercher par nom, email ou téléphone..."
            className="pl-10 rounded-2xl border-none bg-muted/10 focus:ring-primary/20 font-medium h-11"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl font-medium">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="size-10 animate-spin text-primary opacity-50" />
              <p className="text-muted-foreground font-bold text-sm animate-pulse">Chargement des partenariats...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-6">
              <div className="size-20 rounded-[2rem] bg-muted/30 flex items-center justify-center text-muted-foreground/40 border-2 border-dashed border-muted-foreground/20">
                <ShieldCheck className="size-10" />
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-black tracking-tight">Aucun assureur</h3>
                <p className="text-sm text-muted-foreground mt-1 text-balance">Aucune assurance ne correspond à vos critères ou le catalogue est vide.</p>
              </div>
              {searchTerm && (
                <Button variant="ghost" className="rounded-full font-black text-xs uppercase" onClick={() => setSearchTerm("")}>
                  Effacer la recherche
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest py-5">Institution</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Coordonnées</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5 text-center">Statut</TableHead>
                  <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-widest py-5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((item) => (
                  <TableRow key={item.id} className="group hover:bg-muted/40 transition-colors border-muted/50">
                    <TableCell className="pl-8 py-6">
                      <div className="flex items-center gap-4">
                        <div className="size-12 rounded-[1.25rem] bg-indigo-500/10 flex items-center justify-center text-indigo-600 border border-indigo-500/10 group-hover:bg-indigo-600 transition-all group-hover:text-white shadow-sm">
                          <Building2 className="size-6" />
                        </div>
                        <div>
                          <p className="font-black text-lg tracking-tight leading-none mb-1">{item.name}</p>
                          <Badge variant="outline" className="text-[9px] font-black uppercase px-2 py-0 border-muted-foreground/20 text-muted-foreground">
                            Convention Tiers-Payant
                          </Badge>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-6">
                      <div className="flex flex-col gap-1.5 justify-center">
                        {item.email && (
                          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                            <Mail className="size-3 text-primary opacity-60" />
                            {item.email}
                          </div>
                        )}
                        {item.phone && (
                          <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground">
                            <Phone className="size-3 text-primary opacity-60" />
                            {item.phone}
                          </div>
                        )}
                        {!item.email && !item.phone && (
                          <span className="text-[10px] uppercase font-black opacity-30 italic">Aucun contact direct</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-6 text-center">
                      <StatusBadge active={item.isActive} />
                    </TableCell>
                    <TableCell className="text-right pr-8 py-6">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full size-10 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleEditClick(item)}
                          title="Modifier"
                        >
                          <Edit2 className="size-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "rounded-full size-10 transition-all opacity-0 group-hover:opacity-100",
                            item.isActive ? "hover:bg-red-500/10 hover:text-red-600" : "hover:bg-green-500/10 hover:text-green-600"
                          )}
                          onClick={() => toggleStatus(item)}
                          title={item.isActive ? "Désactiver" : "Activer"}
                        >
                          {item.isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!loading && data.length > 0 && (
        <p className="text-[10px] font-bold text-center text-muted-foreground uppercase tracking-[0.2em] pt-4">
          — Répertoire de {data.length} assureurs —
        </p>
      )}
    </div>
  )
}
