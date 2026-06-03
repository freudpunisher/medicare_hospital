"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, Power, PowerOff, Loader2, Award, Building2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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

interface Department {
  id: string
  name: string
  isActive: boolean
}

interface Specialty {
  id: string
  name: string
  description: string | null
  isActive: boolean
  departmentId: string
  departmentName: string | null
}

export default function SpecialtiesPage() {
  const [data, setData] = useState<Specialty[]>([])
  const [departments, setDepartments] = useState<Department[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: "", departmentId: "", description: "" })

  useEffect(() => {
    fetchInitialData()
  }, [])

  async function fetchInitialData() {
    setLoading(true)
    try {
      const [specRes, deptRes] = await Promise.all([
        fetch("/api/specialties/list"),
        fetch("/api/departments/list")
      ])

      const specResult = await specRes.json()
      const deptResult = await deptRes.json()

      if (specResult.success && deptResult.success) {
        setData(specResult.data)
        setDepartments(deptResult.data)
      } else {
        toast.error("Erreur lors du chargement des données")
      }
    } catch (err) {
      toast.error("Impossible de se connecter au serveur")
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!form.name || !form.departmentId) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/specialties/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success("Spécialité ajoutée avec succès")
        setOpen(false)
        setForm({ name: "", departmentId: "", description: "" })
        fetchInitialData() // Refresh list
      } else {
        toast.error(result.error || "Erreur lors de l'ajout")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleStatus(spec: Specialty) {
    try {
      const res = await fetch(`/api/specialties/${spec.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !spec.isActive }),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success(`Spécialité ${!spec.isActive ? 'activée' : 'désactivée'}`)
        setData(prev => prev.map(s => s.id === spec.id ? { ...s, isActive: !s.isActive } : s))
      } else {
        toast.error(result.error || "Erreur lors de la modification")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/specialties/${id}`, { method: "DELETE" })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success("Spécialité supprimée")
        setData(prev => prev.filter(s => s.id !== id))
      } else {
        toast.error(result.error || "Erreur lors de la suppression")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Spécialités" description="Gérer les spécialités médicales et cliniques de l'hôpital">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full shadow-md px-5 font-bold">
              <Plus className="size-4 mr-2" />
              Nouvelle Spécialité
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] border-none shadow-2xl backdrop-blur-xl bg-card/95">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Ajouter une Spécialité</DialogTitle>
              <DialogDescription>Entrez les détails de la spécialité ci-dessous.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Nom de la spécialité</Label>
                  <Input
                    placeholder="ex: Cardiologie, Ophtalmologie..."
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Département Parent</Label>
                  <Select value={form.departmentId} onValueChange={(v) => setForm((f) => ({ ...f, departmentId: v }))}>
                    <SelectTrigger className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20">
                      <SelectValue placeholder="Choisir un département" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-xl">
                      {departments.filter(d => d.isActive).map((d) => (
                        <SelectItem key={d.id} value={d.id} className="rounded-xl">{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Description (optionnel)</Label>
                <Textarea
                  placeholder="Détails sur l'expertise clinique..."
                  className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20 min-h-[100px]"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full font-bold">Annuler</Button>
              <Button onClick={handleAdd} disabled={submitting || !form.name || !form.departmentId} className="rounded-full font-black px-8 shadow-lg">
                {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                Créer la Spécialité
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="size-10 animate-spin text-primary opacity-50" />
              <p className="text-muted-foreground font-bold text-sm animate-pulse">Initialisation du registre...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-6">
              <div className="size-20 rounded-[2rem] bg-muted/30 flex items-center justify-center text-muted-foreground/40 border-2 border-dashed border-muted-foreground/20">
                <Award className="size-10" />
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-black tracking-tight">Aucune spécialité</h3>
                <p className="text-sm text-muted-foreground mt-1">Configurez les domaines d'expertise médicale de votre établissement.</p>
              </div>
              <Button variant="outline" className="rounded-full font-black text-xs uppercase" onClick={() => setOpen(true)}>
                Ajouter une première spécialité
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest py-5">Spécialité</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Département</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Description</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Statut</TableHead>
                  <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-widest py-5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((spec) => (
                  <TableRow key={spec.id} className="group hover:bg-muted/40 transition-colors border-muted/50">
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-600 border border-indigo-500/10 group-hover:bg-indigo-500 transition-colors group-hover:text-white shadow-sm">
                          <Award className="size-5" />
                        </div>
                        <p className="font-black text-base tracking-tight">{spec.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-2 text-muted-foreground font-bold text-xs uppercase tracking-wider">
                        <Building2 className="size-3" />
                        {spec.departmentName || <span className="opacity-30 italic font-medium">Non assigné</span>}
                      </div>
                    </TableCell>
                    <TableCell className="py-5 max-w-sm">
                      <p className="text-xs text-muted-foreground font-medium line-clamp-2">
                        {spec.description || <span className="opacity-30 italic">Aucune description</span>}
                      </p>
                    </TableCell>
                    <TableCell className="py-5">
                      <StatusBadge active={spec.isActive} />
                    </TableCell>
                    <TableCell className="text-right pr-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "rounded-full size-9 transition-all",
                            spec.isActive ? "hover:bg-red-500/10 hover:text-red-600" : "hover:bg-green-500/10 hover:text-green-600"
                          )}
                          onClick={() => toggleStatus(spec)}
                          title={spec.isActive ? "Désactiver" : "Activer"}
                        >
                          {spec.isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full size-9 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-xl font-black">Supprimer {spec.name} ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action supprimera définitivement la spécialité. Cela pourrait impacter les médecins et les actes associés.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-full font-bold">Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(spec.id)}
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
          )}
        </CardContent>
      </Card>

      {!loading && data.length > 0 && (
        <p className="text-[10px] font-bold text-center text-muted-foreground uppercase tracking-[0.2em] pt-4">
          — Total de {data.length} spécialités actives —
        </p>
      )}
    </div>
  )
}
