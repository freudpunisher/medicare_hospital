"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Plus, Trash2, Power, PowerOff, Loader2, FileText, ArrowLeft, Building2, Calendar, Percent, StickyNote, Syringe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Agreement {
  id: string
  agreementNumber: string
  partnerId: string
  partnerName: string
  agreementType: string
  effectiveDate: string
  expiryDate: string | null
  globalDiscountPercentage: number
  maxDiscountPerVisit: number | null
  maxDiscountPerYear: number | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
}

interface Rule {
  id: string
  agreementId: string
  serviceId: string
  serviceName: string
  medicalActId: string | null
  medicalActName: string | null
  specialtyId: string | null
  specialtyName: string | null
  reductionType: string
  reductionValue: number
  maxReductionAmount: number | null
  minBillableAmount: number
  priority: number
  isActive: boolean
}

interface Service {
  id: string
  name: string
}

const AGREEMENT_TYPES: Record<string, string> = {
  discount: "Remise",
  flat_rate: "Tarif Forfaitaire",
  capped: "Plafonné",
}

const REDUCTION_TYPES: Record<string, string> = {
  percentage: "Pourcentage",
  fixed_amount: "Montant Fixe",
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("fr-FR")
}

export default function AgreementDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [agreement, setAgreement] = useState<Agreement | null>(null)
  const [rules, setRules] = useState<Rule[]>([])
  const [loading, setLoading] = useState(true)
  const [rulesLoading, setRulesLoading] = useState(true)

  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [services, setServices] = useState<Service[]>([])
  const [form, setForm] = useState({
    serviceId: "",
    medicalActId: "",
    specialtyId: "",
    reductionType: "",
    reductionValue: "",
    maxReductionAmount: "",
    minBillableAmount: "0",
    priority: "1",
  })

  useEffect(() => {
    fetchAgreement()
    fetchRules()
    fetchServices()
  }, [])

  async function fetchAgreement() {
    try {
      const res = await fetch(`/api/partners/agreements/${id}`)
      const result = await res.json()
      if (res.ok && result.success) {
        setAgreement(result.data)
      } else {
        toast.error(result.error || "Erreur lors du chargement de la convention")
      }
    } catch (err) {
      toast.error("Impossible de se connecter au serveur")
    } finally {
      setLoading(false)
    }
  }

  async function fetchRules() {
    setRulesLoading(true)
    try {
      const res = await fetch(`/api/partners/agreements/rules/list?agreementId=${id}`)
      const result = await res.json()
      if (res.ok && result.success) {
        setRules(result.data)
      } else {
        toast.error(result.error || "Erreur lors du chargement des règles")
      }
    } catch (err) {
      toast.error("Impossible de se connecter au serveur")
    } finally {
      setRulesLoading(false)
    }
  }

  async function fetchServices() {
    try {
      const res = await fetch("/api/services/list")
      const result = await res.json()
      if (res.ok && result.success) {
        setServices(result.data)
      }
    } catch (err) {
      // silent
    }
  }

  function resetForm() {
    setForm({
      serviceId: "", medicalActId: "", specialtyId: "",
      reductionType: "", reductionValue: "",
      maxReductionAmount: "", minBillableAmount: "0", priority: "1",
    })
  }

  async function handleAddRule() {
    if (!form.serviceId || !form.reductionType || !form.reductionValue) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/partners/agreements/rules/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agreementId: id,
          serviceId: form.serviceId,
          medicalActId: form.medicalActId || null,
          specialtyId: form.specialtyId || null,
          reductionType: form.reductionType,
          reductionValue: Number(form.reductionValue),
          maxReductionAmount: form.maxReductionAmount ? Number(form.maxReductionAmount) : null,
          minBillableAmount: Number(form.minBillableAmount),
          priority: Number(form.priority),
        }),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success("Règle ajoutée avec succès")
        setOpen(false)
        resetForm()
        fetchRules()
      } else {
        toast.error(result.error || "Erreur lors de l'ajout")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleRuleStatus(rule: Rule) {
    try {
      const res = await fetch(`/api/partners/agreements/rules/${rule.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !rule.isActive }),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success(`Règle ${!rule.isActive ? 'activée' : 'désactivée'}`)
        setRules(prev => prev.map(r => r.id === rule.id ? { ...r, isActive: !r.isActive } : r))
      } else {
        toast.error(result.error || "Erreur lors de la modification")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    }
  }

  async function handleDeleteRule(ruleId: string) {
    try {
      const res = await fetch(`/api/partners/agreements/rules/${ruleId}`, { method: "DELETE" })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success("Règle supprimée")
        setRules(prev => prev.filter(r => r.id !== ruleId))
      } else {
        toast.error(result.error || "Erreur lors de la suppression")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="p-20 text-center flex flex-col items-center gap-4">
          <Loader2 className="size-10 animate-spin text-primary opacity-50" />
          <p className="text-muted-foreground font-bold text-sm animate-pulse">Chargement de la convention...</p>
        </div>
      </div>
    )
  }

  if (!agreement) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-card/60 backdrop-blur-xl">
          <CardContent className="p-20 text-center">
            <p className="text-muted-foreground font-bold">Convention introuvable</p>
            <Button variant="outline" className="rounded-full font-black mt-4" asChild>
              <Link href="/partners/agreements">Retour aux conventions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={`Convention: ${agreement.agreementNumber}`}
        description={`Détails de la convention avec ${agreement.partnerName}`}
      >
        <Button variant="ghost" size="sm" className="rounded-full font-bold" asChild>
          <Link href="/partners/agreements">
            <ArrowLeft className="size-4 mr-2" />
            Retour
          </Link>
        </Button>
      </PageHeader>

      <Card className="rounded-[2.5rem] border-none shadow-sm bg-card/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-lg font-black">Informations Générales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">N° Convention</p>
              <p className="font-black text-base">{agreement.agreementNumber}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Partenaire</p>
              <p className="font-black text-base flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground/50" />
                {agreement.partnerName}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</p>
              <Badge variant="outline" className="rounded-full font-black text-[11px] px-3 py-1">
                {AGREEMENT_TYPES[agreement.agreementType] || agreement.agreementType}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date d'effet</p>
              <p className="text-sm font-medium flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground/50" />
                {formatDate(agreement.effectiveDate)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Date d'expiration</p>
              <p className="text-sm font-medium flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground/50" />
                {formatDate(agreement.expiryDate)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Remise globale</p>
              <p className="font-black text-base flex items-center gap-2">
                <Percent className="size-4 text-muted-foreground/50" />
                {agreement.globalDiscountPercentage}%
              </p>
            </div>
            {agreement.maxDiscountPerVisit != null && (
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Max remise/visite</p>
                <p className="text-sm font-medium">{agreement.maxDiscountPerVisit.toLocaleString()} FCFA</p>
              </div>
            )}
            {agreement.maxDiscountPerYear != null && (
              <div className="space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Max remise/an</p>
                <p className="text-sm font-medium">{agreement.maxDiscountPerYear.toLocaleString()} FCFA</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Statut</p>
              <StatusBadge active={agreement.isActive} />
            </div>
          </div>
          {agreement.notes && (
            <div className="mt-6 p-4 rounded-2xl bg-muted/20 border border-muted/30">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                <StickyNote className="size-3" />
                Notes
              </p>
              <p className="text-sm font-medium text-muted-foreground">{agreement.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black tracking-tight">Règles de Service</h2>
          <p className="text-sm text-muted-foreground">Conditions de remise par service médical</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full shadow-md px-5 font-bold">
              <Plus className="size-4 mr-2" />
              Ajouter une Règle
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl rounded-[2.5rem] border-none shadow-2xl backdrop-blur-xl bg-card/95">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Ajouter une Règle</DialogTitle>
              <DialogDescription>Définissez une condition de remise pour un service.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Service</Label>
                <Select
                  value={form.serviceId}
                  onValueChange={(v) => setForm((f) => ({ ...f, serviceId: v }))}
                >
                  <SelectTrigger className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20">
                    <SelectValue placeholder="Sélectionnez un service" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-xl">
                    {services.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Acte médical (ID)</Label>
                  <Input
                    placeholder="optionnel"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.medicalActId}
                    onChange={(e) => setForm((f) => ({ ...f, medicalActId: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Spécialité (ID)</Label>
                  <Input
                    placeholder="optionnel"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.specialtyId}
                    onChange={(e) => setForm((f) => ({ ...f, specialtyId: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Type de réduction</Label>
                  <Select
                    value={form.reductionType}
                    onValueChange={(v) => setForm((f) => ({ ...f, reductionType: v }))}
                  >
                    <SelectTrigger className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20">
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-xl">
                      {Object.entries(REDUCTION_TYPES).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Valeur de réduction</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="ex: 10 ou 5000"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.reductionValue}
                    onChange={(e) => setForm((f) => ({ ...f, reductionValue: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Montant max</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="optionnel"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.maxReductionAmount}
                    onChange={(e) => setForm((f) => ({ ...f, maxReductionAmount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Min facturable</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.minBillableAmount}
                    onChange={(e) => setForm((f) => ({ ...f, minBillableAmount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Priorité</Label>
                  <Input
                    type="number"
                    min="1"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.priority}
                    onChange={(e) => setForm((f) => ({ ...f, priority: e.target.value }))}
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full font-bold">Annuler</Button>
              <Button onClick={handleAddRule} disabled={submitting || !form.serviceId || !form.reductionType || !form.reductionValue} className="rounded-full font-black px-8 shadow-lg">
                {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                Ajouter la Règle
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardContent className="p-0">
          {rulesLoading ? (
            <div className="p-16 text-center flex flex-col items-center gap-4">
              <Loader2 className="size-8 animate-spin text-primary opacity-50" />
              <p className="text-muted-foreground font-bold text-sm animate-pulse">Chargement des règles...</p>
            </div>
          ) : rules.length === 0 ? (
            <div className="p-16 text-center flex flex-col items-center gap-6">
              <div className="size-16 rounded-[2rem] bg-muted/30 flex items-center justify-center text-muted-foreground/40 border-2 border-dashed border-muted-foreground/20">
                <Syringe className="size-8" />
              </div>
              <div className="max-w-xs">
                <h3 className="text-base font-black tracking-tight">Aucune règle</h3>
                <p className="text-sm text-muted-foreground mt-1">Aucune règle de service définie pour cette convention.</p>
              </div>
              <Button variant="outline" className="rounded-full font-black text-xs uppercase" onClick={() => setOpen(true)}>
                Ajouter une règle
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest py-5">Service</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Acte Médical</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Spécialité</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Type de Réduction</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Valeur</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Montant Max</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Min Facturable</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Priorité</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Statut</TableHead>
                  <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-widest py-5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rules.map((rule) => (
                  <TableRow key={rule.id} className="group hover:bg-muted/40 transition-colors border-muted/50">
                    <TableCell className="pl-8 py-4">
                      {rule.serviceName ? (
                        <p className="font-black text-sm">{rule.serviceName}</p>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Percent className="size-3.5 text-primary" />
                          <p className="font-black text-sm text-primary">Tous les services</p>
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-xs font-medium text-muted-foreground">{rule.medicalActName || <span className="opacity-30 italic">—</span>}</p>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-xs font-medium text-muted-foreground">{rule.specialtyName || <span className="opacity-30 italic">—</span>}</p>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="rounded-full font-black text-[10px] px-2.5 py-0.5">
                        {REDUCTION_TYPES[rule.reductionType] || rule.reductionType}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="secondary" className="rounded-lg font-mono text-[11px] font-black px-2 py-0.5 bg-muted/50 border-none">
                        {rule.reductionValue}{rule.reductionType === "percentage" ? "%" : " FCFA"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-xs font-medium text-muted-foreground">{rule.maxReductionAmount != null ? `${rule.maxReductionAmount.toLocaleString()} FCFA` : <span className="opacity-30 italic">—</span>}</p>
                    </TableCell>
                    <TableCell className="py-4">
                      <p className="text-xs font-medium text-muted-foreground">{rule.minBillableAmount.toLocaleString()} FCFA</p>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="outline" className="rounded-full font-black text-[10px] px-2.5 py-0.5 bg-background/50 border-muted/50">
                        #{rule.priority}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <StatusBadge active={rule.isActive} />
                    </TableCell>
                    <TableCell className="text-right pr-8 py-4">
                      <div className="flex items-center justify-end gap-2">
                        {!rule.serviceName && !rule.medicalActName && !rule.specialtyName ? (
                          <Badge variant="outline" className="rounded-full text-[10px] px-2.5 py-0.5 bg-primary/5 border-primary/20 text-primary font-bold">
                            Globale
                          </Badge>
                        ) : (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              className={cn(
                                "rounded-full size-8 transition-all",
                                rule.isActive ? "hover:bg-red-500/10 hover:text-red-600" : "hover:bg-green-500/10 hover:text-green-600"
                              )}
                              onClick={() => toggleRuleStatus(rule)}
                              title={rule.isActive ? "Désactiver" : "Activer"}
                            >
                              {rule.isActive ? <PowerOff className="size-3.5" /> : <Power className="size-3.5" />}
                            </Button>

                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="rounded-full size-8 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="size-3.5" />
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
                                <AlertDialogHeader>
                                  <AlertDialogTitle className="text-xl font-black">Supprimer cette règle ?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Cette action est irréversible. La règle sera définitivement supprimée.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-full font-bold">Annuler</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDeleteRule(rule.id)}
                                    className="rounded-full font-black bg-destructive hover:bg-destructive/90"
                                  >
                                    Confirmer la Suppression
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!rulesLoading && rules.length > 0 && (
        <p className="text-[10px] font-bold text-center text-muted-foreground uppercase tracking-[0.2em] pt-2">
          — Total de {rules.length} règles configurées —
        </p>
      )}
    </div>
  )
}
