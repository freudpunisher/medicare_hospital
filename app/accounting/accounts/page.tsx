"use client"

import { useState, useEffect, useMemo } from "react"
import { Plus, Loader2, Pencil, Trash2, BookOpen, BadgeCheck, Ban } from "lucide-react"
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
import { toast } from "sonner"

interface Account {
  id: string
  code: string
  label: string
  class: string
  type: string
  parentId: string | null
  isActive: boolean
  children?: Account[]
}

const CLASS_BADGES: Record<string, { label: string; className: string }> = {
  "1": { label: "Classe 1 · Fonds propres", className: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600" },
  "2": { label: "Classe 2 · Immobilisations", className: "border-blue-500/20 bg-blue-500/10 text-blue-600" },
  "3": { label: "Classe 3 · Stocks", className: "border-cyan-500/20 bg-cyan-500/10 text-cyan-600" },
  "4": { label: "Classe 4 · Tiers", className: "border-violet-500/20 bg-violet-500/10 text-violet-600" },
  "5": { label: "Classe 5 · Trésorerie", className: "border-amber-500/20 bg-amber-500/10 text-amber-600" },
  "6": { label: "Classe 6 · Charges", className: "border-rose-500/20 bg-rose-500/10 text-rose-600" },
  "7": { label: "Classe 7 · Produits", className: "border-slate-500/20 bg-slate-500/10 text-slate-600" },
}

export default function AccountingAccountsPage() {
  const [data, setData] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [classFilter, setClassFilter] = useState<string>("all")

  const [form, setForm] = useState({
    code: "",
    label: "",
    class: "6",
    parentId: "",
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch("/api/accounting/accounts")
      const json = await res.json()
      if (res.ok) setData(json.data)
    } catch (err) {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(
    () => (classFilter === "all" ? data : data.filter((a) => a.class === classFilter)),
    [data, classFilter]
  )

  const parents = data.filter((a) => a.class !== "1" && a.id !== editing?.id)

  function openCreate() {
    setEditing(null)
    setForm({ code: "", label: "", class: "6", parentId: "none" })
    setModalOpen(true)
  }

  function openEdit(account: Account) {
    setEditing(account)
    setForm({ code: account.code, label: account.label, class: account.class, parentId: account.parentId || "none" })
    setModalOpen(true)
  }

  async function handleSave() {
    if (!form.code || !form.label) {
      toast.error("Code et libellé obligatoires")
      return
    }
    setSaving(true)
    try {
      const url = editing ? `/api/accounting/accounts/${editing.id}` : "/api/accounting/accounts"
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          label: form.label,
          class: form.class,
          parentId: form.parentId === "none" ? null : form.parentId,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Erreur")
        return
      }
      toast.success(editing ? "Compte modifié" : "Compte créé")
      setModalOpen(false)
      fetchData()
    } catch (err) {
      toast.error("Erreur réseau")
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleActive(account: Account) {
    try {
      const res = await fetch(`/api/accounting/accounts/${account.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !account.isActive }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Erreur")
        return
      }
      toast.success(account.isActive ? "Compte désactivé" : "Compte activé")
      fetchData()
    } catch (err) {
      toast.error("Erreur réseau")
    }
  }

  async function handleDelete(account: Account) {
    if (!confirm(`Supprimer le compte ${account.code} - ${account.label} ?`)) return
    try {
      const res = await fetch(`/api/accounting/accounts/${account.id}`, { method: "DELETE" })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Erreur")
        return
      }
      toast.success("Compte supprimé")
      fetchData()
    } catch (err) {
      toast.error("Erreur réseau")
    }
  }

  const classCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const a of data) counts[a.class] = (counts[a.class] || 0) + 1
    return counts
  }, [data])

  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto">
      <PageHeader title="Plan Comptable" description="Plan comptable burundais — gestion des comptes de la clinique">
        <Select value={classFilter} onValueChange={setClassFilter}>
          <SelectTrigger className="w-[220px] h-10 rounded-full border-muted bg-white font-bold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-none shadow-2xl">
            <SelectItem value="all">Toutes les classes</SelectItem>
            {["1", "2", "3", "4", "5", "6", "7"].map((c) => (
              <SelectItem key={c} value={c} className="font-bold">
                {CLASS_BADGES[c].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Dialog open={modalOpen} onOpenChange={setModalOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
              <Plus className="size-4 mr-2" />Nouveau Compte
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 bg-slate-900 text-white">
              <DialogTitle className="text-xl font-black uppercase tracking-tight">
                {editing ? "Modifier le Compte" : "Nouveau Compte"}
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">
                {editing ? `${editing.code} · ${editing.label}` : "Ajouter un compte au plan comptable"}
              </DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Code</Label>
                  <Input
                    className="h-12 rounded-2xl border-muted bg-muted/20 font-black text-lg"
                    placeholder="Ex: 616"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Classe</Label>
                  <Select value={form.class} onValueChange={(v) => setForm((f) => ({ ...f, class: v }))}>
                    <SelectTrigger className="h-12 rounded-2xl border-muted bg-muted/20 font-bold">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                      {["1", "2", "3", "4", "5", "6", "7"].map((c) => (
                        <SelectItem key={c} value={c} className="font-bold">{CLASS_BADGES[c].label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Libellé</Label>
                <Input
                  className="h-12 rounded-2xl border-muted bg-muted/20 font-bold"
                  placeholder="Ex: Énergie, eau et télécommunications"
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Compte parent (facultatif)</Label>
                <Select value={form.parentId} onValueChange={(v) => setForm((f) => ({ ...f, parentId: v }))}>
                  <SelectTrigger className="h-12 rounded-2xl border-muted bg-muted/20 font-bold">
                    <SelectValue placeholder="Aucun parent" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="none" className="font-bold">Aucun parent</SelectItem>
                    {parents.map((p) => (
                      <SelectItem key={p.id} value={p.id} className="font-bold">{p.code} · {p.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="p-6 bg-muted/30 border-t border-muted/50 gap-3">
              <Button variant="ghost" className="rounded-full font-black uppercase text-[10px] tracking-widest" onClick={() => setModalOpen(false)}>Annuler</Button>
              <Button className="rounded-full font-black uppercase text-[10px] tracking-widest bg-slate-900 hover:bg-black text-white shadow-xl" onClick={handleSave} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : editing ? "Enregistrer" : "Créer le Compte"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        {["1", "2", "3", "4", "5", "6", "7"].map((c) => (
          <Card key={c} className="rounded-2xl border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex size-8 items-center justify-center rounded-lg bg-muted/40">
                  <BookOpen className="size-4 text-muted-foreground" />
                </div>
                <span className="text-2xl font-black text-foreground">{classCounts[c] || 0}</span>
              </div>
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-3">Classe {c}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-muted/50">
                <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-muted-foreground">Code</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Libellé</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Classe</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Type</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Statut</TableHead>
                <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="h-64 text-center"><Loader2 className="size-8 animate-spin mx-auto text-primary opacity-20" /></TableCell></TableRow>
              ) : filtered.map((account) => (
                <TableRow key={account.id} className="border-muted/50 hover:bg-white/50 transition-colors">
                  <TableCell className="pl-8">
                    <Badge variant="secondary" className="font-mono text-xs">{account.code}</Badge>
                  </TableCell>
                  <TableCell className="font-bold text-sm text-foreground">
                    {account.label}
                    {account.children && account.children.length > 0 && (
                      <span className="ml-2 text-[9px] font-black uppercase tracking-widest text-muted-foreground">
                        · {account.children.length} sous-compte{account.children.length > 1 ? "s" : ""}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`rounded-lg text-[9px] font-black uppercase tracking-widest ${CLASS_BADGES[account.class]?.className}`}>
                      {CLASS_BADGES[account.class]?.label || `Classe ${account.class}`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs font-bold text-muted-foreground uppercase">{account.type}</TableCell>
                  <TableCell>
                    {account.isActive ? (
                      <Badge variant="outline" className="rounded-lg border-emerald-500/20 bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase tracking-widest">
                        <BadgeCheck className="size-3 mr-1" />Actif
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-lg border-slate-300 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                        <Ban className="size-3 mr-1" />Inactif
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="pr-8">
                    <div className="flex items-center justify-end gap-2">
                      <Switch checked={account.isActive} onCheckedChange={() => handleToggleActive(account)} />
                      <Button size="icon" variant="ghost" className="size-8 rounded-full" onClick={() => openEdit(account)}>
                        <Pencil className="size-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="size-8 rounded-full text-destructive hover:text-destructive" onClick={() => handleDelete(account)}>
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
