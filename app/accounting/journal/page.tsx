"use client"

import { useState, useEffect, useMemo, Fragment } from "react"
import { Plus, Loader2, ChevronDown, ChevronRight, Scale, ArrowLeftRight, Zap, Pencil, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Account {
  id: string
  code: string
  label: string
  class: string
  isActive: boolean
}

interface JournalEntry {
  id: string
  entryNumber: string
  entryDate: string
  label: string
  referenceType: string | null
  status: string
  createdAt: string
  lines: {
    id: string
    libelle: string | null
    debit: string
    credit: string
    account: Account
  }[]
  creator: { fullName: string | null; username: string } | null
}

interface EntryLine {
  accountCode: string
  libelle: string
  debit: string
  credit: string
}

const REF_TYPE_LABELS: Record<string, string> = {
  pharmacy_sale: "Vente Pharmacie",
  invoice: "Facture",
  expense: "Dépense",
  purchase_order: "Achat",
  insurance_claim: "Assurance",
  insurance_batch: "Bordereau",
  cash_session: "Session Caisse",
}

export default function AccountingJournalPage() {
  const [data, setData] = useState<JournalEntry[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [q, setQ] = useState("")

  const [form, setForm] = useState({
    entryDate: new Date().toISOString().split("T")[0],
    label: "",
    lines: [] as EntryLine[],
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (q) params.set("q", q)
      const [journalRes, accountsRes] = await Promise.all([
        fetch(`/api/accounting/journal${params.toString() ? `?${params}` : ""}`),
        fetch("/api/accounting/accounts"),
      ])
      const journalJson = await journalRes.json()
      const accountsJson = await accountsRes.json()
      if (journalRes.ok) setData(journalJson.data)
      if (accountsRes.ok) setAccounts(accountsJson.data.filter((a: Account) => a.isActive))
    } catch (err) {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }

  function addLine() {
    setForm((f) => ({ ...f, lines: [...f.lines, { accountCode: "", libelle: "", debit: "", credit: "" }] }))
  }

  function updateLine(index: number, patch: Partial<EntryLine>) {
    setForm((f) => ({
      ...f,
      lines: f.lines.map((l, i) => (i === index ? { ...l, ...patch } : l)),
    }))
  }

  function removeLine(index: number) {
    setForm((f) => ({ ...f, lines: f.lines.filter((_, i) => i !== index) }))
  }

  const totals = useMemo(() => {
    let debit = 0
    let credit = 0
    for (const l of form.lines) {
      debit += parseFloat(l.debit) || 0
      credit += parseFloat(l.credit) || 0
    }
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.01 }
  }, [form.lines])

  async function handleSave() {
    if (!form.label) {
      toast.error("Le libellé est obligatoire")
      return
    }
    if (form.lines.length < 2) {
      toast.error("Ajoutez au moins deux lignes")
      return
    }
    if (!totals.balanced) {
      toast.error(`Écriture non équilibrée: débit ${totals.debit.toLocaleString()} ≠ crédit ${totals.credit.toLocaleString()}`)
      return
    }
    for (const l of form.lines) {
      if (!l.accountCode || (!parseFloat(l.debit) && !parseFloat(l.credit))) {
        toast.error("Chaque ligne doit avoir un compte et un montant")
        return
      }
    }

    setSaving(true)
    try {
      const meRes = await fetch("/api/auth/me")
      const meJson = await meRes.json()

      const res = await fetch("/api/accounting/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryDate: form.entryDate,
          label: form.label,
          createdBy: meRes.ok ? meJson.data?.id : null,
          lines: form.lines.map((l) => ({
            accountCode: l.accountCode,
            libelle: l.libelle || undefined,
            debit: parseFloat(l.debit) || undefined,
            credit: parseFloat(l.credit) || undefined,
          })),
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Erreur")
        return
      }
      toast.success(`Écriture ${json.data.entryNumber} enregistrée`)
      setModalOpen(false)
      setForm({ entryDate: new Date().toISOString().split("T")[0], label: "", lines: [] })
      fetchData()
    } catch (err) {
      toast.error("Erreur réseau")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto">
      <PageHeader title="Journal Comptable" description="Toutes les écritures comptables, automatiques et manuelles">
        <div className="flex items-center gap-2">
          <Input
            className="w-64 h-10 rounded-full border-muted bg-white font-bold"
            placeholder="Rechercher (n° ou libellé)..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchData()}
          />
          <Button variant="outline" className="rounded-full h-10 px-4 font-bold" onClick={fetchData}>
            <Loader2 className="size-4" />
          </Button>
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
                <Plus className="size-4 mr-2" />Écriture Manuelle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
              <DialogHeader className="p-8 bg-slate-900 text-white">
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Nouvelle Écriture</DialogTitle>
                <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                  Écriture manuelle — le débit doit égaler le crédit
                </DialogDescription>
              </DialogHeader>
              <div className="p-8 space-y-6 max-h-[60vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Date</Label>
                    <Input
                      type="date"
                      className="h-12 rounded-2xl border-muted bg-muted/20 font-bold"
                      value={form.entryDate}
                      onChange={(e) => setForm((f) => ({ ...f, entryDate: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Libellé</Label>
                    <Input
                      className="h-12 rounded-2xl border-muted bg-muted/20 font-bold"
                      placeholder="Ex: Ajustement annuel"
                      value={form.label}
                      onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Lignes d'écriture</Label>
                    <Button size="sm" variant="outline" className="rounded-full font-bold" onClick={addLine}>
                      <Plus className="size-3 mr-1" />Ajouter une ligne
                    </Button>
                  </div>

                  {form.lines.map((line, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2 items-center">
                      <div className="col-span-4">
                        <Select value={line.accountCode} onValueChange={(v) => updateLine(index, { accountCode: v })}>
                          <SelectTrigger className="h-11 rounded-xl border-muted bg-muted/20 font-bold text-xs">
                            <SelectValue placeholder="Compte" />
                          </SelectTrigger>
                          <SelectContent className="rounded-2xl border-none shadow-2xl">
                            {accounts.map((a) => (
                              <SelectItem key={a.id} value={a.code} className="font-bold text-xs">
                                {a.code} · {a.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="col-span-3">
                        <Input
                          className="h-11 rounded-xl border-muted bg-muted/20 font-bold text-xs"
                          placeholder="Libellé ligne"
                          value={line.libelle}
                          onChange={(e) => updateLine(index, { libelle: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          className="h-11 rounded-xl border-muted bg-muted/20 font-bold text-xs"
                          placeholder="Débit"
                          value={line.debit}
                          onChange={(e) => updateLine(index, { debit: e.target.value })}
                        />
                      </div>
                      <div className="col-span-2">
                        <Input
                          type="number"
                          className="h-11 rounded-xl border-muted bg-muted/20 font-bold text-xs"
                          placeholder="Crédit"
                          value={line.credit}
                          onChange={(e) => updateLine(index, { credit: e.target.value })}
                        />
                      </div>
                      <div className="col-span-1">
                        <Button size="icon" variant="ghost" className="size-8 rounded-full text-destructive" onClick={() => removeLine(index)}>
                          <X className="size-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className={cn(
                  "flex items-center justify-between p-4 rounded-2xl border",
                  totals.balanced ? "bg-emerald-50 border-emerald-100" : "bg-rose-50 border-rose-100"
                )}>
                  <div className="flex items-center gap-2">
                    <Scale className={cn("size-4", totals.balanced ? "text-emerald-600" : "text-rose-600")} />
                    <span className={cn("text-[10px] font-black uppercase tracking-widest", totals.balanced ? "text-emerald-600" : "text-rose-600")}>
                      {totals.balanced ? "Écriture équilibrée" : "Écriture non équilibrée"}
                    </span>
                  </div>
                  <div className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Débit {totals.debit.toLocaleString()} FBU · Crédit {totals.credit.toLocaleString()} FBU
                  </div>
                </div>
              </div>
              <DialogFooter className="p-6 bg-muted/30 border-t border-muted/50 gap-3">
                <Button variant="ghost" className="rounded-full font-black uppercase text-[10px] tracking-widest" onClick={() => setModalOpen(false)}>Annuler</Button>
                <Button className="rounded-full font-black uppercase text-[10px] tracking-widest bg-slate-900 hover:bg-black text-white shadow-xl" onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : "Enregistrer l'Écriture"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-muted/50">
                <TableHead className="pl-8 w-10 font-black text-[9px] uppercase tracking-widest text-muted-foreground"></TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">N° Écriture</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Date</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Libellé</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Source</TableHead>
                <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-muted-foreground">Débit</TableHead>
                <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-muted-foreground">Crédit</TableHead>
                <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-muted-foreground">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="h-64 text-center"><Loader2 className="size-8 animate-spin mx-auto text-primary opacity-20" /></TableCell></TableRow>
              ) : data.map((entry) => {
                const entryDebit = entry.lines.reduce((s, l) => s + parseFloat(l.debit || "0"), 0)
                const entryCredit = entry.lines.reduce((s, l) => s + parseFloat(l.credit || "0"), 0)
                const isOpen = expanded === entry.id
                return (
                  <Fragment key={entry.id}>
                    <TableRow
                      className="border-muted/50 hover:bg-white/50 transition-colors cursor-pointer"
                      onClick={() => setExpanded(isOpen ? null : entry.id)}
                    >
                      <TableCell className="pl-8">
                        {isOpen ? <ChevronDown className="size-4 text-muted-foreground" /> : <ChevronRight className="size-4 text-muted-foreground" />}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">{entry.entryNumber}</Badge>
                      </TableCell>
                      <TableCell className="text-xs font-bold text-slate-600">{new Date(entry.entryDate).toLocaleDateString()}</TableCell>
                      <TableCell className="font-bold text-sm text-foreground">{entry.label}</TableCell>
                      <TableCell>
                        {entry.referenceType ? (
                          <Badge variant="outline" className="rounded-lg border-primary/20 bg-primary/5 text-primary text-[9px] font-black uppercase tracking-widest">
                            <Zap className="size-3 mr-1" />{REF_TYPE_LABELS[entry.referenceType] || entry.referenceType}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="rounded-lg border-slate-300 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                            <Pencil className="size-3 mr-1" />Manuelle
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-black text-emerald-600">{entryDebit.toLocaleString()}</TableCell>
                      <TableCell className="text-right font-black text-rose-600">{entryCredit.toLocaleString()}</TableCell>
                      <TableCell className="pr-8 text-right">
                        <Badge variant="outline" className="rounded-lg border-emerald-500/20 bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                          Comptabilisée
                        </Badge>
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow className="border-muted/50 bg-muted/10">
                        <TableCell colSpan={8} className="p-0">
                          <div className="p-4 pl-20">
                            <Table>
                              <TableBody>
                                {entry.lines.map((line) => (
                                  <TableRow key={line.id} className="border-0">
                                    <TableCell className="w-24">
                                      <Badge variant="secondary" className="font-mono text-xs">{line.account.code}</Badge>
                                    </TableCell>
                                    <TableCell className="text-xs font-bold text-foreground">{line.account.label}</TableCell>
                                    <TableCell className="text-xs italic text-muted-foreground">{line.libelle}</TableCell>
                                    <TableCell className="text-right font-bold text-emerald-600 w-32">
                                      {parseFloat(line.debit) > 0 ? `${parseFloat(line.debit).toLocaleString()} FBU` : "-"}
                                    </TableCell>
                                    <TableCell className="text-right font-bold text-rose-600 w-32">
                                      {parseFloat(line.credit) > 0 ? `${parseFloat(line.credit).toLocaleString()} FBU` : "-"}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                            <div className="flex items-center gap-4 mt-2 pl-24 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                              <ArrowLeftRight className="size-3" />
                              Par {entry.creator?.fullName || entry.creator?.username || "Système"} · {new Date(entry.createdAt).toLocaleString()}
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
