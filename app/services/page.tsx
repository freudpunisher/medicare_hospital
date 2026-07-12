"use client"

import { useEffect, useState, useMemo } from "react"
import {
  Plus, Trash2, Power, PowerOff, Loader2, Syringe, DollarSign, Ban,
  Pencil, Search, Layers, Building2, FileText, AlertCircle,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Service {
  id: string
  name: string
  code: string
  type: string
  description: string | null
  isBillable: boolean
  isActive: boolean
  actCount: number
}

const typeLabels: Record<string, string> = {
  laboratory: "Laboratoire",
  radiology: "Radiologie",
  cardiology: "Cardiologie",
  neurology: "Neurologie",
  oncology: "Oncologie",
  orthopedics: "Orthopédie",
  pediatrics: "Pédiatrie",
  obstetrics_gynecology: "Gynéco-Obstétrique",
  dermatology: "Dermatologie",
  ophthalmology: "Ophtalmologie",
  otolaryngology: "ORL",
  urology: "Urologie",
  gastroenterology: "Gastro-entérologie",
  pulmonology: "Pneumologie",
  psychiatry: "Psychiatrie",
  anesthesiology: "Anesthésiologie",
  critical_care: "Soins intensifs",
  emergency_medicine: "Urgences",
  general_surgery: "Chirurgie générale",
  laparoscopic_surgery: "Chirurgie laparoscopique",
  plastic_surgery: "Chirurgie plastique",
  pathology: "Pathologie",
  microbiology: "Microbiologie",
  mammography: "Mammographie",
  echocardiography: "Échocardiographie",
  mri: "IRM",
  ct_scan: "Scanner",
  xray: "Radiographie",
  physiotherapy: "Kinésithérapie",
  occupational_therapy: "Ergothérapie",
  pharmacy: "Pharmacie",
  general_dentistry: "Dentisterie générale",
  oral_surgery: "Chirurgie buccale",
  consultation: "Consultation",
  dialysis: "Dialyse",
  chemotherapy: "Chimiothérapie",
  radiation_therapy: "Radiothérapie",
  accommodation: "Hospitalisation",
  other: "Autre",
}

export default function ServicesPage() {
  const [data, setData] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)

  // Create dialog
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", type: "other", isBillable: true })

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false)
  const [editingService, setEditingService] = useState<Service | null>(null)
  const [editSubmitting, setEditSubmitting] = useState(false)
  const [editForm, setEditForm] = useState({ name: "", code: "", description: "", type: "other", isBillable: true })

  // Delete
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all")

  useEffect(() => {
    fetchServices()
  }, [])

  async function fetchServices() {
    setLoading(true)
    try {
      const res = await fetch("/api/services/list")
      const result = await res.json()
      if (res.ok && result.success) {
        setData(result.data)
      } else {
        toast.error(result.error || "Erreur lors du chargement des services")
      }
    } catch (err) {
      toast.error("Impossible de se connecter au serveur")
    } finally {
      setLoading(false)
    }
  }

  const filteredData = useMemo(() => {
    return data.filter((svc) => {
      if (search) {
        const q = search.toLowerCase()
        if (!svc.name.toLowerCase().includes(q) &&
            !svc.code.toLowerCase().includes(q) &&
            !(typeLabels[svc.type] || svc.type).toLowerCase().includes(q)) {
          return false
        }
      }
      if (typeFilter !== "all" && svc.type !== typeFilter) return false
      if (statusFilter === "active" && !svc.isActive) return false
      if (statusFilter === "inactive" && svc.isActive) return false
      return true
    })
  }, [data, search, typeFilter, statusFilter])

  const stats = useMemo(() => {
    const total = data.length
    const active = data.filter((s) => s.isActive).length
    const billable = data.filter((s) => s.isBillable).length
    const totalActs = data.reduce((sum, s) => sum + s.actCount, 0)
    const typeCount = new Set(data.map((s) => s.type)).size
    return { total, active, billable, totalActs, typeCount }
  }, [data])

  async function handleAdd() {
    if (!form.name) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/services/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success("Service ajouté avec succès")
        setOpen(false)
        setForm({ name: "", description: "", type: "other", isBillable: true })
        fetchServices()
      } else {
        toast.error(result.error || "Erreur lors de l'ajout")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    } finally {
      setSubmitting(false)
    }
  }

  function openEdit(service: Service) {
    setEditingService(service)
    setEditForm({
      name: service.name,
      code: service.code,
      description: service.description ?? "",
      type: service.type,
      isBillable: service.isBillable,
    })
    setEditOpen(true)
  }

  async function handleEdit() {
    if (!editingService || !editForm.name) return
    setEditSubmitting(true)
    try {
      const res = await fetch(`/api/services/${editingService.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success("Service modifié avec succès")
        setEditOpen(false)
        setEditingService(null)
        fetchServices()
      } else {
        toast.error(result.error || "Erreur lors de la modification")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    } finally {
      setEditSubmitting(false)
    }
  }

  async function toggleField(service: Service, field: "isActive" | "isBillable") {
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !service[field] }),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success("Service mis à jour avec succès")
        setData((prev) =>
          prev.map((s) => (s.id === service.id ? { ...s, [field]: !service[field] } : s))
        )
      } else {
        toast.error(result.error || "Erreur lors de la modification")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/services/${id}`, { method: "DELETE" })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success("Service supprimé")
        setData((prev) => prev.filter((s) => s.id !== id))
      } else {
        toast.error(result.error || "Erreur lors de la suppression")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Services Cliniques" description="Gérer le catalogue des services médicaux et cliniques">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full shadow-md px-5 font-bold">
              <Plus className="size-4 mr-2" />
              Nouveau Service
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] border-none shadow-2xl backdrop-blur-xl bg-card/95 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Ajouter un Service</DialogTitle>
              <DialogDescription>Entrez les détails du nouveau service clinique ci-dessous.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Nom du service</Label>
                <Input
                  placeholder="ex: Consultation, Radiologie..."
                  className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Type de service</Label>
                <Select value={form.type} onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}>
                  <SelectTrigger className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20">
                    <SelectValue placeholder="Sélectionner un type" />
                  </SelectTrigger>
                  <SelectContent className="max-h-72">
                    {Object.entries(typeLabels).map(([value, label]) => (
                      <SelectItem key={value} value={value}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Description (optionnel)</Label>
                <Textarea
                  placeholder="Détails sur ce service..."
                  className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20 min-h-[80px]"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <Switch
                  id="billable"
                  checked={form.isBillable}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, isBillable: c }))}
                />
                <Label htmlFor="billable" className="font-bold cursor-pointer">Ce service est facturable</Label>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full font-bold">Annuler</Button>
              <Button onClick={handleAdd} disabled={submitting || !form.name} className="rounded-full font-black px-8 shadow-lg">
                {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                Créer le Service
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Building2 className="size-6" />
            </div>
            <div>
              <p className="text-2xl font-black">{stats.total}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Services</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600">
              <Power className="size-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-green-600">{stats.active}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Actifs</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-amber-500/5 to-amber-500/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <Layers className="size-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-amber-600">{stats.typeCount}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Types</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <FileText className="size-6" />
            </div>
            <div>
              <p className="text-2xl font-black text-blue-600">{stats.totalActs}</p>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Actes liés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, code ou type..."
            className="pl-11 h-11 rounded-2xl border-muted/50 bg-card/50 focus:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48 h-11 rounded-2xl border-muted/50 bg-card/50">
            <SelectValue placeholder="Tous les types" />
          </SelectTrigger>
          <SelectContent className="max-h-72">
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(typeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
          <SelectTrigger className="w-full sm:w-40 h-11 rounded-2xl border-muted/50 bg-card/50">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="inactive">Inactifs</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="size-10 animate-spin text-primary opacity-50" />
              <p className="text-muted-foreground font-bold text-sm animate-pulse">Chargement du catalogue...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-6">
              <div className="size-20 rounded-[2rem] bg-muted/30 flex items-center justify-center text-muted-foreground/40 border-2 border-dashed border-muted-foreground/20">
                {search || typeFilter !== "all" || statusFilter !== "all" ? (
                  <AlertCircle className="size-10" />
                ) : (
                  <Syringe className="size-10" />
                )}
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-black tracking-tight">
                  {search || typeFilter !== "all" || statusFilter !== "all"
                    ? "Aucun résultat"
                    : "Catalogue vide"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {search || typeFilter !== "all" || statusFilter !== "all"
                    ? "Aucun service ne correspond à vos critères de recherche."
                    : "Aucun service n'est encore configuré dans votre système."}
                </p>
              </div>
              {search || typeFilter !== "all" || statusFilter !== "all" ? (
                <Button variant="outline" className="rounded-full font-black text-xs uppercase" onClick={() => { setSearch(""); setTypeFilter("all"); setStatusFilter("all") }}>
                  Réinitialiser les filtres
                </Button>
              ) : (
                <Button variant="outline" className="rounded-full font-black text-xs uppercase" onClick={() => setOpen(true)}>
                  Ajouter mon premier service
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest py-5">Service</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Code</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Type</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Actes</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Facturation</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Statut</TableHead>
                      <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-widest py-5">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.map((svc) => (
                      <TableRow key={svc.id} className="group hover:bg-muted/40 transition-colors border-muted/50">
                        <TableCell className="pl-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/10 group-hover:bg-blue-500 transition-colors group-hover:text-white shadow-sm">
                              <Syringe className="size-5" />
                            </div>
                            <div>
                              <p className="font-black text-base tracking-tight">{svc.name}</p>
                              {svc.description && (
                                <p className="text-[11px] text-muted-foreground line-clamp-1 max-w-[260px]">{svc.description}</p>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="secondary" className="rounded-lg font-mono text-[11px] font-black px-2 py-0.5 bg-muted/50 border-none group-hover:bg-background transition-colors">
                            {svc.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="outline" className="rounded-full text-[10px] font-bold px-3 py-1 border-primary/20 bg-primary/5 text-primary whitespace-nowrap">
                            {typeLabels[svc.type] || svc.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="outline" className="rounded-full bg-background/50 border-muted/50 font-black text-[10px] px-3 py-1">
                            {svc.actCount} ACTES
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleField(svc, "isBillable")}
                            className={cn(
                              "rounded-full h-7 px-3 text-[9px] font-black uppercase tracking-wider transition-all",
                              svc.isBillable
                                ? "bg-green-500/10 text-green-600 hover:bg-green-500/20"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                          >
                            {svc.isBillable ? <DollarSign className="size-3 mr-1" /> : <Ban className="size-3 mr-1" />}
                            {svc.isBillable ? "Facturable" : "Gratuit"}
                          </Button>
                        </TableCell>
                        <TableCell className="py-4">
                          <StatusBadge active={svc.isActive} />
                        </TableCell>
                        <TableCell className="text-right pr-8 py-4">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full size-9 hover:bg-primary/10 hover:text-primary transition-all"
                              onClick={() => openEdit(svc)}
                              title="Modifier"
                            >
                              <Pencil className="size-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "rounded-full size-9 transition-all",
                                svc.isActive
                                  ? "hover:bg-red-500/10 hover:text-red-600"
                                  : "hover:bg-green-500/10 hover:text-green-600"
                              )}
                              onClick={() => toggleField(svc, "isActive")}
                              title={svc.isActive ? "Désactiver" : "Activer"}
                            >
                              {svc.isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
                            </Button>
                            <AlertDialog open={deletingId === svc.id} onOpenChange={(o) => !o && setDeletingId(null)}>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-full size-9 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive"
                                  onClick={() => setDeletingId(svc.id)}
                                  title="Supprimer"
                                >
                                  <Trash2 className="size-4" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-xl font-black">Supprimer {svc.name} ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irréversible. Toutes les données associées pourraient être impactées.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-full font-bold">Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(svc.id)}
                                    className="rounded-full font-black bg-destructive hover:bg-destructive/90"
                                  >
                                    Confirmer la Suppression
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="px-8 py-4 border-t border-muted/30 flex items-center justify-between bg-muted/10">
                <p className="text-[11px] font-bold text-muted-foreground">
                  {filteredData.length} service{filteredData.length > 1 ? "s" : ""} affiché{filteredData.length > 1 ? "s" : ""}
                  {filteredData.length < data.length && (
                    <span className="text-muted-foreground/60"> (sur {data.total} total)</span>
                  )}
                </p>
                <div className="flex gap-2 text-[10px] text-muted-foreground">
                  <Badge variant="outline" className="rounded-full text-[10px] font-bold px-3 border-muted/30">
                    {stats.active} actifs
                  </Badge>
                  <Badge variant="outline" className="rounded-full text-[10px] font-bold px-3 border-muted/30">
                    {stats.total - stats.active} inactifs
                  </Badge>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={(o) => { setEditOpen(o); if (!o) setEditingService(null) }}>
        <DialogContent className="rounded-[2.5rem] border-none shadow-2xl backdrop-blur-xl bg-card/95 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black">Modifier le Service</DialogTitle>
            <DialogDescription>Mettez à jour les informations du service.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Nom du service</Label>
              <Input
                placeholder="ex: Consultation, Radiologie..."
                className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Code</Label>
              <Input
                placeholder="ex: SVC-001"
                className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20 font-mono font-bold uppercase"
                value={editForm.code}
                onChange={(e) => setEditForm((f) => ({ ...f, code: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Type de service</Label>
              <Select value={editForm.type} onValueChange={(v) => setEditForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20">
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {Object.entries(typeLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Description (optionnel)</Label>
              <Textarea
                placeholder="Détails sur ce service..."
                className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20 min-h-[80px]"
                value={editForm.description}
                onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <Switch
                id="edit-billable"
                checked={editForm.isBillable}
                onCheckedChange={(c) => setEditForm((f) => ({ ...f, isBillable: c }))}
              />
              <Label htmlFor="edit-billable" className="font-bold cursor-pointer">Ce service est facturable</Label>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="ghost" onClick={() => { setEditOpen(false); setEditingService(null) }} className="rounded-full font-bold">
              Annuler
            </Button>
            <Button onClick={handleEdit} disabled={editSubmitting || !editForm.name} className="rounded-full font-black px-8 shadow-lg">
              {editSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Pencil className="size-4 mr-2" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
