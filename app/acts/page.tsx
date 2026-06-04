"use client"

import { useEffect, useState, useMemo } from "react"
import { Plus, Power, PowerOff, Loader2, Scissors, ShieldCheck, ShieldAlert, Edit2, Search, Filter } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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

interface Act {
  id: string
  code: string
  name: string
  basePrice: string
  requiresAuthorization: boolean
  isActive: boolean
  serviceId: string
  serviceName: string | null
  specialtyId: string | null
  specialtyName: string | null
}

interface Service {
  id: string
  name: string
  isActive: boolean
}

interface Specialty {
  id: string
  name: string
  isActive: boolean
}

export default function ActsPage() {
  const [data, setData] = useState<Act[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Filtering states
  const [searchTerm, setSearchTerm] = useState("")
  const [serviceFilter, setServiceFilter] = useState("all")
  const [specialtyFilter, setSpecialtyFilter] = useState("all")

  const [form, setForm] = useState({
    name: "",
    serviceId: "",
    specialtyId: null as string | null,
    basePrice: 0,
    requiresAuthorization: false,
  })

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    setLoading(true)
    try {
      const [actsRes, servicesRes, specialtiesRes] = await Promise.all([
        fetch("/api/acts/list"),
        fetch("/api/services/list"),
        fetch("/api/specialties/list")
      ])

      const actsResult = await actsRes.json()
      const servicesResult = await servicesRes.json()
      const specialtiesResult = await specialtiesRes.json()

      if (actsResult.success && servicesResult.success && specialtiesResult.success) {
        setData(actsResult.data)
        setServices(servicesResult.data)
        setSpecialties(specialtiesResult.data)
      } else {
        toast.error("Erreur lors du chargement du catalogue")
      }
    } catch (err) {
      toast.error("Impossible de se connecter au serveur")
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setForm({ name: "", serviceId: "", specialtyId: null, basePrice: 0, requiresAuthorization: false })
    setEditingId(null)
  }

  function handleEditClick(act: Act) {
    setEditingId(act.id)
    setForm({
      name: act.name,
      serviceId: act.serviceId,
      specialtyId: act.specialtyId,
      basePrice: parseFloat(act.basePrice) || 0,
      requiresAuthorization: act.requiresAuthorization,
    })
    setOpen(true)
  }

  async function handleSubmit() {
    if (!form.name || !form.serviceId) return
    setSubmitting(true)
    try {
      const url = editingId ? `/api/acts/${editingId}` : "/api/acts/create"
      const method = editingId ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success(editingId ? "Acte mis à jour" : "Acte médical ajouté")
        setOpen(false)
        resetForm()
        fetchInitialData()
      } else {
        toast.error(result.error || "Erreur lors de l'enregistrement")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleField(act: Act, field: 'isActive' | 'requiresAuthorization') {
    try {
      const res = await fetch(`/api/acts/${act.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !act[field] }),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success(`Acte mis à jour`)
        setData(prev => prev.map(a => a.id === act.id ? { ...a, [field]: !act[field] } : a))
      } else {
        toast.error(result.error || "Erreur lors de la modification")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    }
  }

  const filteredData = useMemo(() => {
    return data.filter(act => {
      const matchesSearch =
        act.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.code.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesService = serviceFilter === "all" || act.serviceId === serviceFilter
      const matchesSpecialty = specialtyFilter === "all" || act.specialtyId === specialtyFilter

      return matchesSearch && matchesService && matchesSpecialty
    })
  }, [data, searchTerm, serviceFilter, specialtyFilter])

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Catalogue des Actes" description="Définir les procédures médicales et leurs tarifications">
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full shadow-md px-5 font-bold">
              <Plus className="size-4 mr-2" />
              Nouvel Acte
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] border-none shadow-2xl backdrop-blur-xl bg-card/95 sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">{editingId ? "Modifier l'Acte Médical" : "Ajouter un Acte Médical"}</DialogTitle>
              <DialogDescription>{editingId ? "Mettez à jour les détails de cette procédure." : "Définissez une nouvelle procédure ou prestation facturable."}</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Nom de l'acte</Label>
                  <Input
                    placeholder="ex: Consultation de Spécialité, Extraction..."
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Service Parent</Label>
                  <Select value={form.serviceId} onValueChange={(v) => setForm((f) => ({ ...f, serviceId: v }))}>
                    <SelectTrigger className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20">
                      <SelectValue placeholder="Choisir un service" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-xl">
                      {services.filter(s => s.isActive).map((s) => (
                        <SelectItem key={s.id} value={s.id} className="rounded-xl">{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Spécialité (Optionnelle)</Label>
                  <Select value={form.specialtyId || "none"} onValueChange={(v) => setForm((f) => ({ ...f, specialtyId: v === "none" ? null : v }))}>
                    <SelectTrigger className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20">
                      <SelectValue placeholder="Aucune" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-xl">
                      <SelectItem value="none" className="rounded-xl font-bold italic opacity-60">Aucune</SelectItem>
                      {specialties.filter(s => s.isActive).map((s) => (
                        <SelectItem key={s.id} value={s.id} className="rounded-xl">{s.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6 items-center">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Prix de Base (FBU)</Label>
                  <Input
                    type="number"
                    placeholder="0"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20 font-black"
                    value={form.basePrice}
                    onChange={(e) => setForm((f) => ({ ...f, basePrice: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div className="flex items-center space-x-3 p-4 rounded-2xl bg-warning/5 border border-warning/10 h-10 mt-6">
                  <Switch
                    id="auth"
                    checked={form.requiresAuthorization}
                    onCheckedChange={(c) => setForm((f) => ({ ...f, requiresAuthorization: c }))}
                  />
                  <Label htmlFor="auth" className="font-bold cursor-pointer text-xs">Autorisation requise</Label>
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => { setOpen(false); resetForm(); }} className="rounded-full font-bold">Annuler</Button>
              <Button onClick={handleSubmit} disabled={submitting || !form.name || !form.serviceId} className="rounded-full font-black px-8 shadow-lg">
                {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : (editingId ? <Edit2 className="size-4 mr-2" /> : <Plus className="size-4 mr-2" />)}
                {editingId ? "Mettre à jour" : "Valider l'Acte"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Filter Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-card/40 p-4 rounded-[2rem] border border-muted/20 backdrop-blur-sm">
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground opacity-50" />
          <Input
            placeholder="Rechercher par nom ou code..."
            className="pl-10 rounded-2xl border-none bg-muted/20 focus:ring-primary/20 font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div>
          <Select value={serviceFilter} onValueChange={setServiceFilter}>
            <SelectTrigger className="rounded-2xl border-none bg-muted/20 focus:ring-primary/20 font-bold text-xs uppercase">
              <div className="flex items-center gap-2">
                <Filter className="size-3 opacity-50" />
                <SelectValue placeholder="Service: Tous" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-xl">
              <SelectItem value="all" className="rounded-xl font-bold italic">Tous les Services</SelectItem>
              {services.map(s => (
                <SelectItem key={s.id} value={s.id} className="rounded-xl">{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Select value={specialtyFilter} onValueChange={setSpecialtyFilter}>
            <SelectTrigger className="rounded-2xl border-none bg-muted/20 focus:ring-primary/20 font-bold text-xs uppercase">
              <div className="flex items-center gap-2">
                <Filter className="size-3 opacity-50" />
                <SelectValue placeholder="Spécialité: Toutes" />
              </div>
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-xl">
              <SelectItem value="all" className="rounded-xl font-bold italic">Toutes les Spécialités</SelectItem>
              {specialties.map(s => (
                <SelectItem key={s.id} value={s.id} className="rounded-xl">{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl font-medium">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="size-10 animate-spin text-primary opacity-50" />
              <p className="text-muted-foreground font-bold text-sm animate-pulse">Chargement de la tarification...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-6">
              <div className="size-20 rounded-[2rem] bg-muted/30 flex items-center justify-center text-muted-foreground/40 border-2 border-dashed border-muted-foreground/20">
                <Scissors className="size-10" />
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-black tracking-tight">Aucun résultat</h3>
                <p className="text-sm text-muted-foreground mt-1 text-balance">Aucun acte ne correspond à vos critères de recherche dans le catalogue actuel.</p>
              </div>
              {(searchTerm || serviceFilter !== "all" || specialtyFilter !== "all") && (
                <Button variant="ghost" className="rounded-full font-black text-xs uppercase" onClick={() => { setSearchTerm(""); setServiceFilter("all"); setSpecialtyFilter("all"); }}>
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest py-5">Prestation</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Classification</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Tarif (FBU)</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Autorisation</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Statut</TableHead>
                  <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-widest py-5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredData.map((act) => (
                  <TableRow key={act.id} className="group hover:bg-muted/40 transition-colors border-muted/50">
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-teal-500/10 flex items-center justify-center text-teal-600 border border-teal-500/10 group-hover:bg-teal-500 transition-colors group-hover:text-white shadow-sm">
                          <Scissors className="size-5" />
                        </div>
                        <div>
                          <p className="font-black text-base tracking-tight">{act.name}</p>
                          <p className="text-[10px] font-mono font-bold opacity-50 uppercase tracking-tighter">{act.code}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex flex-col gap-1">
                        <Badge variant="outline" className="w-fit text-[9px] font-black uppercase px-2 py-0 border-primary/20 text-primary bg-primary/5">
                          {act.serviceName || "Service N/A"}
                        </Badge>
                        {act.specialtyName && (
                          <Badge variant="outline" className="w-fit text-[9px] font-black uppercase px-2 py-0 border-indigo-200 text-indigo-600 bg-indigo-50">
                            {act.specialtyName}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-1 font-black text-base">
                        {Number(act.basePrice).toLocaleString('fr-FR')}
                        <span className="text-[10px] text-muted-foreground/60 uppercase">fbu</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      {act.requiresAuthorization ? (
                        <Badge variant="outline" className="rounded-full bg-orange-50 border-orange-200 text-orange-600 font-black text-[9px] px-2 py-0.5">
                          <ShieldAlert className="size-3 mr-1" /> OUI
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="rounded-full bg-blue-50 border-blue-200 text-blue-600 font-black text-[9px] px-2 py-0.5 opacity-40 group-hover:opacity-100 transition-opacity">
                          <ShieldCheck className="size-3 mr-1" /> NON
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="py-5">
                      <StatusBadge active={act.isActive} />
                    </TableCell>
                    <TableCell className="text-right pr-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full size-9 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary"
                          onClick={() => handleEditClick(act)}
                          title="Modifier"
                        >
                          <Edit2 className="size-4" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "rounded-full size-9 transition-all opacity-0 group-hover:opacity-100",
                            act.isActive ? "hover:bg-red-500/10 hover:text-red-600" : "hover:bg-green-500/10 hover:text-green-600"
                          )}
                          onClick={() => toggleField(act, 'isActive')}
                          title={act.isActive ? "Désactiver" : "Activer"}
                        >
                          {act.isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
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

      {!loading && filteredData.length > 0 && (
        <p className="text-[10px] font-bold text-center text-muted-foreground uppercase tracking-[0.2em] pt-4">
          — {filteredData.length} actes affichés sur {data.length} au total —
        </p>
      )}
    </div>
  )
}
