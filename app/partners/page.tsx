"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, Power, PowerOff, Loader2, Building2, Calendar, Phone, Mail, Globe } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Partner {
  id: string
  companyName: string
  registrationNumber: string | null
  taxId: string | null
  contactPerson: string | null
  contactEmail: string | null
  contactPhone: string | null
  address: string | null
  website: string | null
  isActive: boolean
  partnershipStartDate: string
  partnershipEndDate: string | null
  autoRenew: boolean
  notes: string | null
}

export default function PartnersPage() {
  const [data, setData] = useState<Partner[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    companyName: "",
    registrationNumber: "",
    taxId: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    website: "",
    partnershipStartDate: "",
    partnershipEndDate: "",
    autoRenew: false,
    notes: "",
  })

  useEffect(() => {
    fetchPartners()
  }, [])

  async function fetchPartners() {
    setLoading(true)
    try {
      const res = await fetch("/api/partners/list")
      const result = await res.json()
      if (res.ok && result.success) {
        setData(result.data)
      } else {
        toast.error(result.error || "Erreur lors du chargement des partenaires")
      }
    } catch (err) {
      toast.error("Impossible de se connecter au serveur")
    } finally {
      setLoading(false)
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return "—"
    return new Date(dateStr).toLocaleDateString("fr-FR")
  }

  async function handleAdd() {
    if (!form.companyName || !form.partnershipStartDate) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/partners/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          partnershipEndDate: form.partnershipEndDate || null,
        }),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success("Partenaire ajouté avec succès")
        setOpen(false)
        setForm({
          companyName: "", registrationNumber: "", taxId: "", contactPerson: "",
          contactEmail: "", contactPhone: "", address: "", website: "",
          partnershipStartDate: "", partnershipEndDate: "", autoRenew: false, notes: "",
        })
        fetchPartners()
      } else {
        toast.error(result.error || "Erreur lors de l'ajout")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleStatus(partner: Partner) {
    try {
      const res = await fetch(`/api/partners/${partner.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !partner.isActive }),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success(`Partenaire ${!partner.isActive ? 'activé' : 'désactivé'}`)
        setData(prev => prev.map(p => p.id === partner.id ? { ...p, isActive: !p.isActive } : p))
      } else {
        toast.error(result.error || "Erreur lors de la modification")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/partners/${id}`, { method: "DELETE" })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success("Partenaire supprimé")
        setData(prev => prev.filter(p => p.id !== id))
      } else {
        toast.error(result.error || "Erreur lors de la suppression")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Partenaires Corporate" description="Gérer les entreprises partenaires et leurs conventions">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full shadow-md px-5 font-bold">
              <Plus className="size-4 mr-2" />
              Nouveau Partenaire
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl backdrop-blur-xl bg-card/95">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Ajouter un Partenaire</DialogTitle>
              <DialogDescription>Enregistrez une nouvelle entreprise partenaire dans le système.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6 max-h-[60vh] overflow-y-auto pr-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 col-span-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Nom de l'entreprise</Label>
                  <Input
                    placeholder="ex: Société Générale..."
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.companyName}
                    onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Numéro d'enregistrement</Label>
                  <Input
                    placeholder="RC ou NINEA"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.registrationNumber}
                    onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">N° Fiscal (Tax ID)</Label>
                  <Input
                    placeholder="ex: 123456789"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.taxId}
                    onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Personne de contact</Label>
                  <Input
                    placeholder="Nom complet"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.contactPerson}
                    onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Email de contact</Label>
                  <Input
                    placeholder="contact@entreprise.com"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.contactEmail}
                    onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Téléphone</Label>
                  <Input
                    placeholder="+221 33 000 00 00"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.contactPhone}
                    onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Site web</Label>
                  <Input
                    placeholder="https://entreprise.com"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.website}
                    onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Adresse</Label>
                <Textarea
                  placeholder="Adresse complète de l'entreprise..."
                  className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20 min-h-[60px]"
                  value={form.address}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Date de début de partenariat</Label>
                  <Input
                    type="date"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.partnershipStartDate}
                    onChange={(e) => setForm((f) => ({ ...f, partnershipStartDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Date de fin (optionnelle)</Label>
                  <Input
                    type="date"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.partnershipEndDate}
                    onChange={(e) => setForm((f) => ({ ...f, partnershipEndDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                <Switch
                  id="autoRenew"
                  checked={form.autoRenew}
                  onCheckedChange={(c) => setForm((f) => ({ ...f, autoRenew: c }))}
                />
                <Label htmlFor="autoRenew" className="font-bold cursor-pointer">Renouvellement automatique</Label>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Notes (optionnel)</Label>
                <Textarea
                  placeholder="Informations complémentaires..."
                  className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20 min-h-[80px]"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full font-bold">Annuler</Button>
              <Button onClick={handleAdd} disabled={submitting || !form.companyName || !form.partnershipStartDate} className="rounded-full font-black px-8 shadow-lg">
                {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                Créer le Partenaire
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
              <p className="text-muted-foreground font-bold text-sm animate-pulse">Chargement des partenaires...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-6">
              <div className="size-20 rounded-[2rem] bg-muted/30 flex items-center justify-center text-muted-foreground/40 border-2 border-dashed border-muted-foreground/20">
                <Building2 className="size-10" />
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-black tracking-tight">Aucun partenaire</h3>
                <p className="text-sm text-muted-foreground mt-1">Commencez par ajouter une entreprise partenaire à votre système.</p>
              </div>
              <Button variant="outline" className="rounded-full font-black text-xs uppercase" onClick={() => setOpen(true)}>
                Ajouter mon premier partenaire
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest py-5">Entreprise</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">N° Enregistrement</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Contact</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Email</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Statut</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Partenariat</TableHead>
                  <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-widest py-5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((partner) => (
                  <TableRow key={partner.id} className="group hover:bg-muted/40 transition-colors border-muted/50">
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 group-hover:bg-primary transition-colors group-hover:text-primary-foreground shadow-sm">
                          <Building2 className="size-5" />
                        </div>
                        <div>
                          <p className="font-black text-base tracking-tight">{partner.companyName}</p>
                          {partner.autoRenew && (
                            <span className="text-[10px] font-bold text-green-600 uppercase tracking-wider">Renouvellement auto.</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <p className="text-xs font-medium text-muted-foreground">
                        {partner.registrationNumber || <span className="opacity-30 italic">—</span>}
                      </p>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex flex-col gap-0.5">
                        {partner.contactPerson && (
                          <p className="text-xs font-medium flex items-center gap-1">
                            <Phone className="size-3 text-muted-foreground/50" />
                            {partner.contactPerson}
                          </p>
                        )}
                        {partner.contactPhone && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Phone className="size-3 text-muted-foreground/50" />
                            {partner.contactPhone}
                          </p>
                        )}
                        {!partner.contactPerson && !partner.contactPhone && (
                          <span className="text-xs text-muted-foreground opacity-30 italic">Aucun contact</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      {partner.contactEmail ? (
                        <p className="text-xs font-medium flex items-center gap-1">
                          <Mail className="size-3 text-muted-foreground/50" />
                          {partner.contactEmail}
                        </p>
                      ) : (
                        <span className="text-xs text-muted-foreground opacity-30 italic">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-5">
                      <StatusBadge active={partner.isActive} />
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex flex-col gap-0.5">
                        <p className="text-xs font-medium flex items-center gap-1">
                          <Calendar className="size-3 text-muted-foreground/50" />
                          Du {formatDate(partner.partnershipStartDate)}
                        </p>
                        {partner.partnershipEndDate && (
                          <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                            <Calendar className="size-3 text-muted-foreground/50" />
                            Au {formatDate(partner.partnershipEndDate)}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right pr-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "rounded-full size-9 transition-all",
                            partner.isActive ? "hover:bg-red-500/10 hover:text-red-600" : "hover:bg-green-500/10 hover:text-green-600"
                          )}
                          onClick={() => toggleStatus(partner)}
                          title={partner.isActive ? "Désactiver" : "Activer"}
                        >
                          {partner.isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
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
                              <AlertDialogTitle className="text-xl font-black">Supprimer {partner.companyName} ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. Toutes les données associées (employés, conventions) seront également supprimées.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-full font-bold">Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(partner.id)}
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
          — Total de {data.length} partenaires configurés —
        </p>
      )}
    </div>
  )
}
