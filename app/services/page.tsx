"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, Power, PowerOff, Loader2, Syringe, DollarSign, Ban } from "lucide-react"
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
  description: string | null
  isBillable: boolean
  isActive: boolean
  actCount: number
}

export default function ServicesPage() {
  const [data, setData] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", isBillable: true })

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
        setForm({ name: "", description: "", isBillable: true })
        fetchServices() // Refresh list
      } else {
        toast.error(result.error || "Erreur lors de l'ajout")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleField(service: Service, field: 'isActive' | 'isBillable') {
    try {
      const res = await fetch(`/api/services/${service.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [field]: !service[field] }),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success(`Service mis à jour avec succès`)
        setData(prev => prev.map(s => s.id === service.id ? { ...s, [field]: !service[field] } : s))
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
      <PageHeader title="Services Cliniques" description="Gérer le catalogue des services médicaux et cliniques">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full shadow-md px-5 font-bold">
              <Plus className="size-4 mr-2" />
              Nouveau Service
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] border-none shadow-2xl backdrop-blur-xl bg-card/95">
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

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="size-10 animate-spin text-primary opacity-50" />
              <p className="text-muted-foreground font-bold text-sm animate-pulse">Chargement du catalogue...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-6">
              <div className="size-20 rounded-[2rem] bg-muted/30 flex items-center justify-center text-muted-foreground/40 border-2 border-dashed border-muted-foreground/20">
                <Syringe className="size-10" />
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-black tracking-tight">Catalogue vide</h3>
                <p className="text-sm text-muted-foreground mt-1">Aucun service n'est encore configuré dans votre système.</p>
              </div>
              <Button variant="outline" className="rounded-full font-black text-xs uppercase" onClick={() => setOpen(true)}>
                Ajouter mon premier service
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest py-5">Service</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Code</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Actes</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Facturation</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Statut</TableHead>
                  <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-widest py-5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((svc) => (
                  <TableRow key={svc.id} className="group hover:bg-muted/40 transition-colors border-muted/50">
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 border border-blue-500/10 group-hover:bg-blue-500 transition-colors group-hover:text-white shadow-sm">
                          <Syringe className="size-5" />
                        </div>
                        <p className="font-black text-base tracking-tight">{svc.name}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <Badge variant="secondary" className="rounded-lg font-mono text-[11px] font-black px-2 py-0.5 bg-muted/50 border-none group-hover:bg-background transition-colors">
                        {svc.code}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5">
                      <Badge variant="outline" className="rounded-full bg-background/50 border-muted/50 font-black text-[10px] px-3 py-1">
                        {svc.actCount} ACTES
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleField(svc, 'isBillable')}
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
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <StatusBadge active={svc.isActive} />
                    </TableCell>
                    <TableCell className="text-right pr-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "rounded-full size-9 transition-all",
                            svc.isActive ? "hover:bg-red-500/10 hover:text-red-600" : "hover:bg-green-500/10 hover:text-green-600"
                          )}
                          onClick={() => toggleField(svc, 'isActive')}
                          title={svc.isActive ? "Désactiver" : "Activer"}
                        >
                          {svc.isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
                        </Button>

                        {/* <AlertDialog>
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
                        </AlertDialog> */}
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
          — Total de {data.length} services cliniques répertoriés —
        </p>
      )}
    </div>
  )
}
