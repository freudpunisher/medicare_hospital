"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Plus, Pencil, Power, PowerOff, Loader2, FileText, Building2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
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
}

interface Partner {
  id: string
  companyName: string
}

const AGREEMENT_TYPES: Record<string, string> = {
  discount: "Remise",
  flat_rate: "Tarif Forfaitaire",
  capped: "Plafonné",
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("fr-FR")
}

export default function AgreementsPage() {
  const router = useRouter()
  const [data, setData] = useState<Agreement[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [partners, setPartners] = useState<Partner[]>([])
  const [form, setForm] = useState({
    partnerId: "",
    agreementType: "",
    effectiveDate: "",
    expiryDate: "",
    globalDiscountPercentage: "",
    maxDiscountPerVisit: "",
    maxDiscountPerYear: "",
    notes: "",
  })

  useEffect(() => {
    fetchAgreements()
    fetchPartners()
  }, [])

  async function fetchAgreements() {
    setLoading(true)
    try {
      const res = await fetch("/api/partners/agreements/list")
      const result = await res.json()
      if (res.ok && result.success) {
        setData(result.data)
      } else {
        toast.error(result.error || "Erreur lors du chargement des conventions")
      }
    } catch (err) {
      toast.error("Impossible de se connecter au serveur")
    } finally {
      setLoading(false)
    }
  }

  async function fetchPartners() {
    try {
      const res = await fetch("/api/partners/list")
      const result = await res.json()
      if (res.ok && result.success) {
        setPartners(result.data)
      }
    } catch (err) {
      // silent
    }
  }

  function resetForm() {
    setForm({
      partnerId: "", agreementType: "",
      effectiveDate: "", expiryDate: "", globalDiscountPercentage: "",
      maxDiscountPerVisit: "", maxDiscountPerYear: "", notes: "",
    })
  }

  async function handleAdd() {
    if (!form.partnerId || !form.agreementType || !form.effectiveDate) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/partners/agreements/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          globalDiscountPercentage: form.globalDiscountPercentage ? Number(form.globalDiscountPercentage) : null,
          maxDiscountPerVisit: form.maxDiscountPerVisit ? Number(form.maxDiscountPerVisit) : null,
          maxDiscountPerYear: form.maxDiscountPerYear ? Number(form.maxDiscountPerYear) : null,
          expiryDate: form.expiryDate || null,
          notes: form.notes || null,
        }),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success("Convention ajoutée avec succès")
        setOpen(false)
        resetForm()
        fetchAgreements()
      } else {
        toast.error(result.error || "Erreur lors de l'ajout")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleStatus(agr: Agreement) {
    try {
      const res = await fetch(`/api/partners/agreements/${agr.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !agr.isActive }),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success(`Convention ${!agr.isActive ? 'activée' : 'désactivée'}`)
        setData(prev => prev.map(a => a.id === agr.id ? { ...a, isActive: !a.isActive } : a))
      } else {
        toast.error(result.error || "Erreur lors de la modification")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    }
  }

  return (
    <div className="p-6 space-y-6  mx-auto">
      <PageHeader title="Conventions Partenaires" description="Gérer les conventions et accords avec les entreprises partenaires">
        <Dialog open={open} onOpenChange={setOpen} >
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full shadow-md px-5 font-bold">
              <Plus className="size-4 mr-2" />
              Nouvelle Convention
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl rounded-[2.5rem] border-none shadow-2xl backdrop-blur-xl bg-card/95" style={{ maxWidth: "70vw" }}>
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Ajouter une Convention</DialogTitle>
              <DialogDescription>Définissez un nouvel accord de partenariat.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6 max-h-[60vh] overflow-y-auto pr-2">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Partenaire</Label>
                <Select
                  value={form.partnerId}
                  onValueChange={(v) => setForm((f) => ({ ...f, partnerId: v }))}
                >
                  <SelectTrigger className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20">
                    <SelectValue placeholder="Sélectionnez un partenaire" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-xl">
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Type de convention</Label>
                  <Select
                    value={form.agreementType}
                    onValueChange={(v) => setForm((f) => ({ ...f, agreementType: v }))}
                  >
                    <SelectTrigger className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20">
                      <SelectValue placeholder="Sélectionnez un type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-xl">
                      {Object.entries(AGREEMENT_TYPES).map(([val, label]) => (
                        <SelectItem key={val} value={val}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Date d'effet</Label>
                  <Input
                    type="date"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.effectiveDate}
                    onChange={(e) => setForm((f) => ({ ...f, effectiveDate: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Date d'expiration (optionnelle)</Label>
                  <Input
                    type="date"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.expiryDate}
                    onChange={(e) => setForm((f) => ({ ...f, expiryDate: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Remise globale %</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    placeholder="ex: 10"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.globalDiscountPercentage}
                    onChange={(e) => setForm((f) => ({ ...f, globalDiscountPercentage: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Max remise/visite</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="ex: 5000"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.maxDiscountPerVisit}
                    onChange={(e) => setForm((f) => ({ ...f, maxDiscountPerVisit: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Max remise/an</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="ex: 50000"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.maxDiscountPerYear}
                    onChange={(e) => setForm((f) => ({ ...f, maxDiscountPerYear: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Notes (optionnel)</Label>
                <Textarea
                  placeholder="Conditions particulières..."
                  className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20 min-h-[80px]"
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full font-bold">Annuler</Button>
              <Button onClick={handleAdd} disabled={submitting || !form.partnerId || !form.agreementType || !form.effectiveDate} className="rounded-full font-black px-8 shadow-lg">
                {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                Créer la Convention
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
              <p className="text-muted-foreground font-bold text-sm animate-pulse">Chargement des conventions...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-6">
              <div className="size-20 rounded-[2rem] bg-muted/30 flex items-center justify-center text-muted-foreground/40 border-2 border-dashed border-muted-foreground/20">
                <FileText className="size-10" />
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-black tracking-tight">Aucune convention</h3>
                <p className="text-sm text-muted-foreground mt-1">Aucune convention partenaire n'est encore configurée.</p>
              </div>
              <Button variant="outline" className="rounded-full font-black text-xs uppercase" onClick={() => setOpen(true)}>
                Ajouter ma première convention
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest py-5">N° Convention</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Partenaire</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Type</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Date d'effet</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Expiration</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Remise globale</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Statut</TableHead>
                  <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-widest py-5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((agr) => (
                  <TableRow key={agr.id} className="group hover:bg-muted/40 transition-colors border-muted/50">
                    <TableCell className="pl-8 py-5">
                      <Link href={`/partners/agreements/${agr.id}`} className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 group-hover:bg-primary transition-colors group-hover:text-primary-foreground shadow-sm">
                          <FileText className="size-5" />
                        </div>
                        <p className="font-black text-base tracking-tight">{agr.agreementNumber}</p>
                      </Link>
                    </TableCell>
                    <TableCell className="py-5">
                      <Link href={`/partners/agreements/${agr.id}`} className="flex items-center gap-2">
                        <Building2 className="size-4 text-muted-foreground/50" />
                        <span className="text-xs font-medium">{agr.partnerName}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="py-5">
                      <Link href={`/partners/agreements/${agr.id}`}>
                        <Badge variant="outline" className="rounded-full bg-background/50 border-muted/50 font-black text-[10px] px-3 py-1">
                          {AGREEMENT_TYPES[agr.agreementType] || agr.agreementType}
                        </Badge>
                      </Link>
                    </TableCell>
                    <TableCell className="py-5">
                      <Link href={`/partners/agreements/${agr.id}`}>
                        <p className="text-xs font-medium">{formatDate(agr.effectiveDate)}</p>
                      </Link>
                    </TableCell>
                    <TableCell className="py-5">
                      <Link href={`/partners/agreements/${agr.id}`}>
                        <p className="text-xs text-muted-foreground">{formatDate(agr.expiryDate)}</p>
                      </Link>
                    </TableCell>
                    <TableCell className="py-5">
                      <Link href={`/partners/agreements/${agr.id}`}>
                        <Badge variant="secondary" className="rounded-lg font-mono text-[11px] font-black px-2 py-0.5 bg-muted/50 border-none">
                          {agr.globalDiscountPercentage}%
                        </Badge>
                      </Link>
                    </TableCell>
                    <TableCell className="py-5">
                      <Link href={`/partners/agreements/${agr.id}`}>
                        <StatusBadge active={agr.isActive} />
                      </Link>
                    </TableCell>
                    <TableCell className="text-right pr-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "rounded-full size-9 transition-all",
                            agr.isActive ? "hover:bg-red-500/10 hover:text-red-600" : "hover:bg-green-500/10 hover:text-green-600"
                          )}
                          onClick={() => toggleStatus(agr)}
                          title={agr.isActive ? "Désactiver" : "Activer"}
                        >
                          {agr.isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
                        </Button>

                        <Button
                          variant="ghost"
                          size="icon"
                          className="rounded-full size-9 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary"
                          onClick={() => router.push(`/partners/agreements/${agr.id}`)}
                          title="Modifier"
                        >
                          <Pencil className="size-4" />
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
          — Total de {data.length} conventions configurées —
        </p>
      )}
    </div>
  )
}
