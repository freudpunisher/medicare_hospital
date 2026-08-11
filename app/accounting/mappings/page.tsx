"use client"

import { useState, useEffect } from "react"
import { Loader2, Save, Zap, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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
  isActive: boolean
}

interface Mapping {
  id: string
  eventType: string
  label: string
  debitCode: string
  creditCode: string
  isActive: boolean
}

export default function AccountingMappingsPage() {
  const [data, setData] = useState<Mapping[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const res = await fetch("/api/accounting/mappings")
      const json = await res.json()
      if (res.ok) {
        setData(json.data)
        setAccounts(json.accounts)
      }
    } catch (err) {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(mapping: Mapping) {
    setSavingId(mapping.id)
    try {
      const res = await fetch("/api/accounting/mappings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: mapping.id,
          debitCode: mapping.debitCode,
          creditCode: mapping.creditCode,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Erreur")
        return
      }
      toast.success("Règle mise à jour")
    } catch (err) {
      toast.error("Erreur réseau")
    } finally {
      setSavingId(null)
    }
  }

  function updateMapping(id: string, patch: Partial<Mapping>) {
    setData((d) => d.map((m) => (m.id === id ? { ...m, ...patch } : m)))
  }

  async function handleToggleActive(mapping: Mapping) {
    try {
      const res = await fetch("/api/accounting/mappings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: mapping.id,
          debitCode: mapping.debitCode,
          creditCode: mapping.creditCode,
          isActive: !mapping.isActive,
        }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error || "Erreur")
        return
      }
      toast.success(mapping.isActive ? "Règle désactivée" : "Règle activée")
    } catch (err) {
      toast.error("Erreur réseau")
    }
  }

  const accountLabel = (code: string) => {
    const account = accounts.find((a) => a.code === code)
    return account ? `${account.code} · ${account.label}` : `${code} · introuvable`
  }

  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto">
      <PageHeader
        title="Règles d'Automatisation"
        description="Configurez les comptes utilisés pour chaque événement — le journal se crée tout seul"
      />

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-muted/50">
                <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-muted-foreground">Événement</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Compte Débit</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Compte Crédit</TableHead>
                <TableHead className="text-center font-black text-[9px] uppercase tracking-widest text-muted-foreground">Active</TableHead>
                <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={5} className="h-64 text-center"><Loader2 className="size-8 animate-spin mx-auto text-primary opacity-20" /></TableCell></TableRow>
              ) : data.map((mapping) => (
                <TableRow key={mapping.id} className="border-muted/50 hover:bg-white/50 transition-colors">
                  <TableCell className="pl-8">
                    <div className="flex items-center gap-2">
                      <div className="flex size-9 items-center justify-center rounded-lg bg-primary/10">
                        <Zap className="size-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-black text-sm uppercase tracking-tight">{mapping.label}</p>
                        <p className="text-[9px] font-bold text-muted-foreground font-mono">{mapping.eventType}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Select value={mapping.debitCode} onValueChange={(v) => updateMapping(mapping.id, { debitCode: v })}>
                      <SelectTrigger className="w-[260px] h-11 rounded-2xl border-muted bg-muted/20 font-bold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {accounts.filter((a) => a.isActive).map((a) => (
                          <SelectItem key={a.id} value={a.code} className="font-bold text-xs">
                            {a.code} · {a.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[9px] font-black uppercase tracking-widest text-emerald-600 mt-1 ml-1">→ {accountLabel(mapping.debitCode)}</p>
                  </TableCell>
                  <TableCell>
                    <Select value={mapping.creditCode} onValueChange={(v) => updateMapping(mapping.id, { creditCode: v })}>
                      <SelectTrigger className="w-[260px] h-11 rounded-2xl border-muted bg-muted/20 font-bold text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {accounts.filter((a) => a.isActive).map((a) => (
                          <SelectItem key={a.id} value={a.code} className="font-bold text-xs">
                            {a.code} · {a.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-[9px] font-black uppercase tracking-widest text-rose-600 mt-1 ml-1">→ {accountLabel(mapping.creditCode)}</p>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch checked={mapping.isActive} onCheckedChange={() => handleToggleActive(mapping)} />
                  </TableCell>
                  <TableCell className="pr-8 text-right">
                    <Button
                      size="sm"
                      className="rounded-full h-9 px-4 font-black uppercase text-[9px] tracking-widest bg-slate-900 hover:bg-black text-white"
                      onClick={() => handleSave(mapping)}
                      disabled={savingId === mapping.id}
                    >
                      {savingId === mapping.id ? <Loader2 className="size-3 animate-spin mr-1" /> : <Save className="size-3 mr-1" />}
                      Enregistrer
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="rounded-[2rem] border-none shadow-sm bg-slate-900 text-white">
        <CardContent className="p-6 flex items-start gap-4">
          <div className="flex size-10 items-center justify-center rounded-xl bg-white/10">
            <ArrowRight className="size-5" />
          </div>
          <div>
            <p className="font-black uppercase text-[10px] tracking-widest text-white/50">Comment ça marche</p>
            <p className="text-sm font-bold mt-1 text-white/90">
              À chaque événement (vente, facture, dépense, achat, règlement assurance), l'application crée
              automatiquement une écriture équilibrée selon ces règles. Modifiez les comptes ici pour adapter
              le plan comptable sans toucher au code.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
