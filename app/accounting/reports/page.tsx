"use client"

import { useState, useEffect } from "react"
import { Loader2, Scale, BookOpen, TrendingUp, Landmark, RefreshCw } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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

const fmt = (n?: number) => `${(n ?? 0).toLocaleString("fr-FR", { minimumFractionDigits: 0 })} FBU`

function FilterBar({
  onApply,
  onAccountChange,
}: {
  onApply: (from: string, to: string) => void
  onAccountChange?: (id: string) => void
}) {
  const [from, setFrom] = useState("")
  const [to, setTo] = useState("")

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Du</p>
        <Input type="date" className="h-10 rounded-2xl border-muted bg-white font-bold" value={from} onChange={(e) => setFrom(e.target.value)} />
      </div>
      <div className="space-y-1">
        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Au</p>
        <Input type="date" className="h-10 rounded-2xl border-muted bg-white font-bold" value={to} onChange={(e) => setTo(e.target.value)} />
      </div>
      <Button className="rounded-full h-10 px-5 font-black uppercase text-[9px] tracking-widest bg-slate-900 hover:bg-black text-white" onClick={() => onApply(from, to)}>
        <RefreshCw className="size-3 mr-2" />Appliquer
      </Button>
    </div>
  )
}

export default function AccountingReportsPage() {
  const [tab, setTab] = useState("trial")
  const [accounts, setAccounts] = useState<Account[]>([])
  const [ledgerAccount, setLedgerAccount] = useState("all")
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState({ from: "", to: "" })

  async function fetchData(from = range.from, to = range.to) {
    setLoading(true)
    setData(null)
    try {
      const params = new URLSearchParams({ type: tab })
      if (from) params.set("from", from)
      if (to) params.set("to", to)
      if (tab === "ledger" && ledgerAccount && ledgerAccount !== "all") params.set("accountId", ledgerAccount)

      const [reportRes, accountsRes] = await Promise.all([
        fetch(`/api/accounting/reports?${params.toString()}`),
        fetch("/api/accounting/accounts"),
      ])
      const reportJson = await reportRes.json()
      const accountsJson = await accountsRes.json()
      if (reportRes.ok) setData(reportJson.data)
      else setData(null)
      if (accountsRes.ok) setAccounts(accountsJson.data.filter((a: Account) => a.isActive))
    } catch (err) {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [tab, ledgerAccount])

  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto">
      <PageHeader title="Rapports Comptables" description="Balance de vérification, grand livre, résultat et bilan" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="rounded-full bg-muted/40 p-1 h-11">
          <TabsTrigger value="trial" className="rounded-full font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow">
            <Scale className="size-3.5 mr-1" />Balance
          </TabsTrigger>
          <TabsTrigger value="ledger" className="rounded-full font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow">
            <BookOpen className="size-3.5 mr-1" />Grand Livre
          </TabsTrigger>
          <TabsTrigger value="income" className="rounded-full font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow">
            <TrendingUp className="size-3.5 mr-1" />Compte de Résultat
          </TabsTrigger>
          <TabsTrigger value="balance" className="rounded-full font-bold text-xs data-[state=active]:bg-white data-[state=active]:shadow">
            <Landmark className="size-3.5 mr-1" />Bilan
          </TabsTrigger>
        </TabsList>

        <div className="mt-6 flex flex-wrap items-end gap-3">
          <FilterBar onApply={(from, to) => { setRange({ from, to }); fetchData(from, to) }} />
          {tab === "ledger" && (
            <div className="space-y-1">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Compte</p>
              <Select value={ledgerAccount} onValueChange={setLedgerAccount}>
                <SelectTrigger className="w-[300px] h-10 rounded-2xl border-muted bg-white font-bold text-xs">
                  <SelectValue placeholder="Tous les comptes" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-none shadow-2xl">
                  <SelectItem value="all" className="font-bold text-xs">Tous les comptes</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id} className="font-bold text-xs">{a.code} · {a.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {loading ? (
          <Card className="mt-6 rounded-[2.5rem] border-none shadow-sm">
            <CardContent className="h-64 flex items-center justify-center">
              <Loader2 className="size-8 animate-spin text-primary opacity-20" />
            </CardContent>
          </Card>
        ) : (
          <>
            {/* ============ TRIAL BALANCE ============ */}
            {tab === "trial" && (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="rounded-3xl border-none shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Débits</p>
                      <p className="text-2xl font-black text-emerald-600 mt-1">{fmt(data?.totals?.totalDebit || 0)}</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-3xl border-none shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Crédits</p>
                      <p className="text-2xl font-black text-rose-600 mt-1">{fmt(data?.totals?.totalCredit || 0)}</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-3xl border-none shadow-sm bg-slate-900 text-white">
                    <CardContent className="p-5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/50">Équilibre</p>
                      <p className="text-2xl font-black mt-1">
                        {(data?.totals?.totalDebit || 0) === (data?.totals?.totalCredit || 0) ? "✓ Équilibrée" : "✗ Déséquilibrée"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
                <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-xl">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="border-muted/50">
                          <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-muted-foreground">Compte</TableHead>
                          <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Libellé</TableHead>
                          <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-muted-foreground">Débit</TableHead>
                          <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-muted-foreground">Crédit</TableHead>
                          <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-muted-foreground">Solde</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.data?.length === 0 && (
                          <TableRow><TableCell colSpan={5} className="h-32 text-center text-xs font-bold text-muted-foreground">Aucune écriture sur la période</TableCell></TableRow>
                        )}
                        {data?.data?.map((row: any) => (
                          <TableRow key={row.accountId} className="border-muted/50 hover:bg-white/50 transition-colors">
                            <TableCell className="pl-8"><Badge variant="secondary" className="font-mono text-xs">{row.code}</Badge></TableCell>
                            <TableCell className="font-bold text-sm">{row.label}</TableCell>
                            <TableCell className={cn("text-right font-black", row.totalDebit > 0 ? "text-emerald-600" : "text-muted-foreground")}>{row.totalDebit > 0 ? fmt(row.totalDebit) : "-"}</TableCell>
                            <TableCell className={cn("text-right font-black", row.totalCredit > 0 ? "text-rose-600" : "text-muted-foreground")}>{row.totalCredit > 0 ? fmt(row.totalCredit) : "-"}</TableCell>
                            <TableCell className="pr-8 text-right font-black text-slate-700">{fmt(row.balance)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ============ GENERAL LEDGER ============ */}
            {tab === "ledger" && (
              <Card className="mt-6 rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-xl">
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-muted/50">
                        <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-muted-foreground">Date</TableHead>
                        <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">N° Écriture</TableHead>
                        <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Libellé</TableHead>
                        <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Compte</TableHead>
                        <TableHead className="text-right font-black text-[9px] uppercase tracking-widest text-muted-foreground">Débit</TableHead>
                        <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-muted-foreground">Crédit</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {data?.data?.length === 0 && (
                        <TableRow><TableCell colSpan={6} className="h-32 text-center text-xs font-bold text-muted-foreground">Aucune écriture sur la période</TableCell></TableRow>
                      )}
                      {data?.data?.map((row: any) => (
                        <TableRow key={row.lineId} className="border-muted/50 hover:bg-white/50 transition-colors">
                          <TableCell className="pl-8 text-xs font-bold text-slate-600">{new Date(row.entryDate).toLocaleDateString()}</TableCell>
                          <TableCell><Badge variant="secondary" className="font-mono text-xs">{row.entryNumber}</Badge></TableCell>
                          <TableCell className="font-bold text-sm">{row.label}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="font-mono text-xs">{row.code}</Badge>
                            <span className="ml-2 text-xs font-bold text-muted-foreground">{row.accountLabel}</span>
                          </TableCell>
                          <TableCell className={cn("text-right font-black", row.debit > 0 ? "text-emerald-600" : "text-muted-foreground")}>{row.debit > 0 ? fmt(row.debit) : "-"}</TableCell>
                          <TableCell className={cn("pr-8 text-right font-black", row.credit > 0 ? "text-rose-600" : "text-muted-foreground")}>{row.credit > 0 ? fmt(row.credit) : "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* ============ INCOME STATEMENT ============ */}
            {tab === "income" && (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="rounded-3xl border-none shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Charges (6)</p>
                      <p className="text-2xl font-black text-rose-600 mt-1">{fmt(data?.totals?.totalExpenses || 0)}</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-3xl border-none shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Produits (7)</p>
                      <p className="text-2xl font-black text-emerald-600 mt-1">{fmt(data?.totals?.totalRevenue || 0)}</p>
                    </CardContent>
                  </Card>
                  <Card className={cn("rounded-3xl border-none shadow-sm", (data?.totals?.netResult || 0) >= 0 ? "bg-emerald-600 text-white" : "bg-rose-600 text-white")}>
                    <CardContent className="p-5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/60">Résultat Net</p>
                      <p className="text-2xl font-black mt-1">{fmt(data?.totals?.netResult || 0)}</p>
                    </CardContent>
                  </Card>
                </div>
                <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-xl">
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-muted/30">
                        <TableRow className="border-muted/50">
                          <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-muted-foreground">Compte</TableHead>
                          <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Libellé</TableHead>
                          <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Classe</TableHead>
                          <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-muted-foreground">Montant</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data?.data?.map((row: any) => (
                          <TableRow key={row.code} className="border-muted/50 hover:bg-white/50 transition-colors">
                            <TableCell className="pl-8"><Badge variant="secondary" className="font-mono text-xs">{row.code}</Badge></TableCell>
                            <TableCell className="font-bold text-sm">{row.label}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("rounded-lg text-[9px] font-black uppercase tracking-widest", row.class === "6" ? "border-rose-500/20 bg-rose-500/10 text-rose-600" : "border-emerald-500/20 bg-emerald-500/10 text-emerald-600")}>
                                {row.class === "6" ? "Charges" : "Produits"}
                              </Badge>
                            </TableCell>
                            <TableCell className={cn("pr-8 text-right font-black", row.class === "6" ? "text-rose-600" : "text-emerald-600")}>{fmt(row.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* ============ BALANCE SHEET ============ */}
            {tab === "balance" && (
              <div className="mt-6 space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Card className="rounded-3xl border-none shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Actif</p>
                      <p className="text-2xl font-black text-slate-700 mt-1">{fmt(data?.totals?.totalAssets || 0)}</p>
                    </CardContent>
                  </Card>
                  <Card className="rounded-3xl border-none shadow-sm">
                    <CardContent className="p-5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Passif + Résultat</p>
                      <p className="text-2xl font-black text-slate-700 mt-1">{fmt(data?.totals?.totalLiabilities || 0)}</p>
                    </CardContent>
                  </Card>
                  <Card className={cn("rounded-3xl border-none shadow-sm", Math.abs(data?.totals?.difference || 0) < 0.01 ? "bg-slate-900 text-white" : "bg-amber-500 text-white")}>
                    <CardContent className="p-5">
                      <p className="text-[9px] font-black uppercase tracking-widest text-white/50">Différence</p>
                      <p className="text-2xl font-black mt-1">{Math.abs(data?.totals?.difference || 0) < 0.01 ? "✓ Équilibré" : fmt(data?.totals?.difference || 0)}</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-xl">
                    <CardContent className="p-0">
                      <div className="p-4 bg-emerald-600 text-white">
                        <p className="font-black uppercase text-[10px] tracking-widest">Actif</p>
                      </div>
                      <Table>
                        <TableBody>
                          {data?.data?.assets?.map((row: any) => (
                            <TableRow key={row.code} className="border-muted/50">
                              <TableCell className="pl-8"><Badge variant="secondary" className="font-mono text-xs">{row.code}</Badge></TableCell>
                              <TableCell className="font-bold text-sm">{row.label}</TableCell>
                              <TableCell className="pr-8 text-right font-black">{fmt(row.balance)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={2} className="pl-8 font-black uppercase text-[10px] tracking-widest">Total Actif</TableCell>
                            <TableCell className="pr-8 text-right font-black text-lg">{fmt(data?.totals?.totalAssets || 0)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                  <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-xl">
                    <CardContent className="p-0">
                      <div className="p-4 bg-rose-600 text-white">
                        <p className="font-black uppercase text-[10px] tracking-widest">Passif</p>
                      </div>
                      <Table>
                        <TableBody>
                          {data?.data?.liabilities?.map((row: any) => (
                            <TableRow key={row.code} className="border-muted/50">
                              <TableCell className="pl-8"><Badge variant="secondary" className="font-mono text-xs">{row.code}</Badge></TableCell>
                              <TableCell className="font-bold text-sm">{row.label}</TableCell>
                              <TableCell className="pr-8 text-right font-black">{fmt(row.balance)}</TableCell>
                            </TableRow>
                          ))}
                          <TableRow className="bg-slate-900 text-white">
                            <TableCell colSpan={2} className="pl-8 font-black uppercase text-[10px] tracking-widest">Résultat de l'exercice</TableCell>
                            <TableCell className="pr-8 text-right font-black">{fmt(data?.totals?.result || 0)}</TableCell>
                          </TableRow>
                          <TableRow className="bg-muted/20">
                            <TableCell colSpan={2} className="pl-8 font-black uppercase text-[10px] tracking-widest">Total Passif</TableCell>
                            <TableCell className="pr-8 text-right font-black text-lg">{fmt(data?.totals?.totalLiabilities || 0)}</TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </>
        )}
      </Tabs>
    </div>
  )
}
