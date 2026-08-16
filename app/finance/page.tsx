"use client"

import { useState, useEffect, useRef } from "react"
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Printer,
    CalendarRange,
    Loader2,
    CheckCircle2,
    Activity,
    Pill,
    ReceiptText,
    Trophy,
    Package,
    Repeat,
    FileCheck2,
    Boxes,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { FinanceReportA4 } from "@/components/finance/finance-report-a4"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface FinanceSummary {
    totalRevenue: number
    totalCosts: number
    netBalance: number
    breakdown: {
        pharmacy: number
        medicalActs: number
        purchases: number
        expenses: number
    }
}

interface ActItem {
    id: string
    name: string
    code: string
    usageCount: number
    invoiceCount: number
    revenue: number
}

interface ActBreakdown {
    total: number
    usageCount: number
    invoiceCount: number
    top: { name: string; usageCount: number; revenue: number } | null
    items: ActItem[]
}

interface PharmacyItem {
    id: string
    name: string
    quantity: number
    revenue: number
}

interface PharmacyBreakdown {
    total: number
    unitsSold: number
    transactionCount: number
    top: { name: string; quantity: number; revenue: number } | null
    items: PharmacyItem[]
}

interface FinanceData {
    summary: FinanceSummary
    acts: ActBreakdown
    pharmacy: PharmacyBreakdown
    from: string | null
    to: string | null
}

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} FBU`

function StatCard({
    icon: Icon,
    label,
    value,
    sub,
    className,
    badge,
}: {
    icon: any
    label: string
    value: React.ReactNode
    sub?: React.ReactNode
    className?: string
    badge?: string
}) {
    return (
        <Card className={cn("rounded-[2rem] border-none shadow-sm overflow-hidden relative", className)}>
            <div className="absolute -top-10 -right-10 size-40 bg-white/10 rounded-full blur-3xl" />
            <CardContent className="p-6 space-y-3">
                <div className="flex justify-between items-start">
                    <div className="size-11 rounded-2xl bg-white/15 flex items-center justify-center">
                        <Icon className="size-5" />
                    </div>
                    {badge && (
                        <Badge className="bg-white/15 text-white border-none text-[9px] font-black uppercase">{badge}</Badge>
                    )}
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">{label}</p>
                    <p className="text-3xl font-black tracking-tight leading-none">{value}</p>
                    {sub && <p className="mt-2 text-[10px] font-bold opacity-80">{sub}</p>}
                </div>
            </CardContent>
        </Card>
    )
}

function ShareBar({ share }: { share: number }) {
    return (
        <div className="flex items-center gap-2 min-w-[140px]">
            <div className="flex-1 h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                    style={{ width: `${Math.min(100, Math.max(2, share))}%` }}
                />
            </div>
            <span className="text-[10px] font-black text-slate-400 w-10 text-right tabular-nums">{share.toFixed(1)}%</span>
        </div>
    )
}

function ActsPanel({ acts }: { acts: ActBreakdown }) {
    const maxRevenue = Math.max(1, ...acts.items.map((i) => i.revenue))
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Activity}
                    label="Revenus Actes Médicaux"
                    value={fmt(acts.total)}
                    badge="Recettes"
                    className="bg-gradient-to-br from-emerald-600 to-emerald-500 text-white"
                />
                <StatCard
                    icon={Repeat}
                    label="Prestations Facturées"
                    value={acts.usageCount.toLocaleString("fr-FR")}
                    badge="Volume"
                    className="bg-gradient-to-br from-blue-600 to-indigo-500 text-white"
                />
                <StatCard
                    icon={ReceiptText}
                    label="Factures Émises"
                    value={acts.invoiceCount.toLocaleString("fr-FR")}
                    badge="Documents"
                    className="bg-gradient-to-br from-slate-700 to-slate-900 text-white"
                />
                <StatCard
                    icon={Trophy}
                    label="Acte le Plus Demandé"
                    value={acts.top ? acts.top.name : "—"}
                    sub={acts.top ? `${acts.top.usageCount} prestations • ${fmt(acts.top.revenue)}` : "Aucune activité sur la période"}
                    badge="Top 1"
                    className="bg-gradient-to-br from-amber-500 to-orange-500 text-white"
                />
            </div>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-6 pb-3 flex items-center justify-between border-b border-slate-100">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Classement des Actes Médicaux</p>
                            <p className="text-xs font-bold text-slate-400 mt-1">Triés par revenu généré — part de chaque acte dans le total</p>
                        </div>
                        <Badge variant="outline" className="rounded-full">{acts.items.length} actes</Badge>
                    </div>
                    {acts.items.length === 0 ? (
                        <div className="py-14 text-center text-sm font-bold text-muted-foreground">
                            Aucune prestation facturée sur la période sélectionnée
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        {["#", "Acte Médical", "Code", "Utilisations", "Factures", "Revenu (FBU)", "Part du Revenu"].map((h, i) => (
                                            <th key={h} className={cn(
                                                "px-6 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400",
                                                i >= 3 && "text-right"
                                            )}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {acts.items.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4 text-xs font-black text-slate-300">#{idx + 1}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-100">
                                                {item.name}
                                                {idx === 0 && (
                                                    <span className="ml-2 text-[8px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">Leader</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-xs font-black uppercase text-slate-400">{item.code}</td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-slate-700 tabular-nums">{item.usageCount}</td>
                                            <td className="px-6 py-4 text-right text-sm text-slate-500 tabular-nums">{item.invoiceCount}</td>
                                            <td className="px-6 py-4 text-right text-sm font-black text-slate-900 dark:text-white tabular-nums">{item.revenue.toLocaleString("fr-FR")}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end">
                                                    <ShareBar share={(item.revenue / maxRevenue) * 100} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <td className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500" colSpan={3}>
                                            Total {acts.usageCount} prestations • {acts.invoiceCount} factures
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-black text-slate-900 dark:text-white tabular-nums" colSpan={1}>
                                            {acts.usageCount.toLocaleString("fr-FR")}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-black text-slate-900 dark:text-white tabular-nums" colSpan={1}>
                                            {acts.invoiceCount.toLocaleString("fr-FR")}
                                        </td>
                                        <td className="px-6 py-4 text-right text-base font-black text-emerald-600 tabular-nums">
                                            {acts.total.toLocaleString("fr-FR")}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-black text-emerald-600">100%</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function PharmacyPanel({ pharmacy }: { pharmacy: PharmacyBreakdown }) {
    const maxRevenue = Math.max(1, ...pharmacy.items.map((i) => i.revenue))
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Pill}
                    label="Revenus Pharmacie"
                    value={fmt(pharmacy.total)}
                    badge="Recettes"
                    className="bg-gradient-to-br from-emerald-600 to-emerald-500 text-white"
                />
                <StatCard
                    icon={Boxes}
                    label="Unités Vendues"
                    value={pharmacy.unitsSold.toLocaleString("fr-FR")}
                    badge="Volume"
                    className="bg-gradient-to-br from-blue-600 to-indigo-500 text-white"
                />
                <StatCard
                    icon={Package}
                    label="Transactions"
                    value={pharmacy.transactionCount.toLocaleString("fr-FR")}
                    badge="Ventes"
                    className="bg-gradient-to-br from-slate-700 to-slate-900 text-white"
                />
                <StatCard
                    icon={Trophy}
                    label="Produit le Plus Vendu"
                    value={pharmacy.top ? pharmacy.top.name : "—"}
                    sub={pharmacy.top ? `${pharmacy.top.quantity.toLocaleString("fr-FR")} unités • ${fmt(pharmacy.top.revenue)}` : "Aucune vente sur la période"}
                    badge="Top 1"
                    className="bg-gradient-to-br from-amber-500 to-orange-500 text-white"
                />
            </div>

            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                <CardContent className="p-0">
                    <div className="p-6 pb-3 flex items-center justify-between border-b border-slate-100">
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Classement des Ventes Pharmacie</p>
                            <p className="text-xs font-bold text-slate-400 mt-1">Triés par revenu généré — part de chaque produit dans le total</p>
                        </div>
                        <Badge variant="outline" className="rounded-full">{pharmacy.items.length} produits</Badge>
                    </div>
                    {pharmacy.items.length === 0 ? (
                        <div className="py-14 text-center text-sm font-bold text-muted-foreground">
                            Aucune vente en pharmacie sur la période sélectionnée
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                                    <tr>
                                        {["#", "Produit", "Quantité Vendue", "Revenu (FBU)", "Part du Revenu"].map((h, i) => (
                                            <th key={h} className={cn(
                                                "px-6 py-3 text-[9px] font-black uppercase tracking-widest text-slate-400",
                                                i >= 2 && "text-right"
                                            )}>
                                                {h}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {pharmacy.items.map((item, idx) => (
                                        <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                                            <td className="px-6 py-4 text-xs font-black text-slate-300">#{idx + 1}</td>
                                            <td className="px-6 py-4 text-sm font-bold text-slate-800 dark:text-slate-100">
                                                {item.name}
                                                {idx === 0 && (
                                                    <span className="ml-2 text-[8px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 dark:bg-amber-500/10 px-2 py-0.5 rounded-full">Leader</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm font-bold text-slate-700 tabular-nums">{item.quantity.toLocaleString("fr-FR")}</td>
                                            <td className="px-6 py-4 text-right text-sm font-black text-slate-900 dark:text-white tabular-nums">{item.revenue.toLocaleString("fr-FR")}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex justify-end">
                                                    <ShareBar share={(item.revenue / maxRevenue) * 100} />
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-slate-50 dark:bg-slate-800/50">
                                    <tr>
                                        <td className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-500" colSpan={2}>
                                            Total {pharmacy.transactionCount} transactions • {pharmacy.unitsSold.toLocaleString("fr-FR")} unités
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-black text-slate-900 dark:text-white tabular-nums">
                                            {pharmacy.unitsSold.toLocaleString("fr-FR")}
                                        </td>
                                        <td className="px-6 py-4 text-right text-base font-black text-emerald-600 tabular-nums">
                                            {pharmacy.total.toLocaleString("fr-FR")}
                                        </td>
                                        <td className="px-6 py-4 text-right text-sm font-black text-emerald-600">100%</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default function FinancePage() {
    const [from, setFrom] = useState("")
    const [to, setTo] = useState("")
    const [range, setRange] = useState<{ from: string; to: string }>({ from: "", to: "" })
    const [data, setData] = useState<FinanceData | null>(null)
    const [loading, setLoading] = useState(true)
    const printRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchSummary(range.from, range.to)
    }, [range])

    async function fetchSummary(fromParam = range.from, toParam = range.to) {
        setLoading(true)
        setData(null)
        try {
            const params = new URLSearchParams()
            if (fromParam) params.set("from", fromParam)
            if (toParam) params.set("to", toParam)
            const res = await fetch(`/api/finance/summary?${params.toString()}`)
            const json = await res.json()
            if (res.ok) setData(json.data)
            else toast.error(json.error || "Échec de la récupération des données")
        } catch (err) {
            toast.error("Échec de la récupération des données financières")
        } finally {
            setLoading(false)
        }
    }

    const applyFilter = () => {
        if (from && to && new Date(from) > new Date(to)) {
            toast.error("La date de début doit précéder la date de fin")
            return
        }
        setRange({ from, to })
    }

    const handlePrint = () => {
        window.print()
    }

    const periodLabel = data?.from && data?.to
        ? `Du ${new Date(data.from).toLocaleDateString("fr-FR")} au ${new Date(data.to).toLocaleDateString("fr-FR")}`
        : data?.from
            ? `À partir du ${new Date(data.from).toLocaleDateString("fr-FR")}`
            : data?.to
                ? `Jusqu'au ${new Date(data.to).toLocaleDateString("fr-FR")}`
                : "Mois en cours"

    return (
        <div className="relative min-h-screen bg-muted/5">
            {/* Dashboard Content - Hidden during print */}
            <div className="p-6 space-y-8 max-w-[1400px] mx-auto print:hidden">
                <PageHeader
                    title="Console Financière"
                    description="Analyse des recettes par centre de profit : actes médicaux & pharmacie"
                >
                    <div className="flex items-end gap-3">
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Du</p>
                            <Input type="date" className="h-10 rounded-2xl border-muted bg-white font-bold" value={from} onChange={(e) => setFrom(e.target.value)} />
                        </div>
                        <div className="space-y-1">
                            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Au</p>
                            <Input type="date" className="h-10 rounded-2xl border-muted bg-white font-bold" value={to} onChange={(e) => setTo(e.target.value)} />
                        </div>
                        <Button className="rounded-full h-10 px-5 font-black uppercase text-[9px] tracking-widest bg-slate-900 hover:bg-black text-white" onClick={applyFilter}>
                            <CalendarRange className="size-3 mr-2" /> Appliquer
                        </Button>
                        <Button
                            variant="outline"
                            className="rounded-full h-10 px-5 font-black uppercase text-[9px] tracking-widest border-border"
                            onClick={handlePrint}
                        >
                            <Printer className="size-3 mr-2" /> Rapport A4
                        </Button>
                    </div>
                </PageHeader>

                {loading ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="size-12 animate-spin text-primary opacity-20" />
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Agrégation des flux...</p>
                    </div>
                ) : data ? (
                    <>
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                            <span className="w-2 h-2 rounded-full bg-primary" />
                            Période analysée : <span className="text-foreground">{periodLabel}</span>
                        </div>

                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="rounded-[2.5rem] border-none shadow-sm bg-gradient-to-br from-emerald-600 to-emerald-500 text-white overflow-hidden relative">
                                <div className="absolute -top-10 -right-10 size-40 bg-white/10 rounded-full blur-3xl" />
                                <CardContent className="p-8 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                            <TrendingUp className="size-6" />
                                        </div>
                                        <Badge className="bg-white/20 text-white border-none text-[9px] font-black uppercase">Recettes</Badge>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Revenus Globaux</p>
                                        <h2 className="text-4xl font-black tracking-tight leading-none">
                                            {data.summary.totalRevenue.toLocaleString("fr-FR")}
                                            <span className="text-xs ml-2 opacity-70 italic uppercase tracking-tighter">FBU</span>
                                        </h2>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[2.5rem] border-none shadow-sm bg-gradient-to-br from-rose-600 to-rose-500 text-white overflow-hidden relative">
                                <div className="absolute -top-10 -right-10 size-40 bg-white/10 rounded-full blur-3xl" />
                                <CardContent className="p-8 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                            <TrendingDown className="size-6" />
                                        </div>
                                        <Badge className="bg-white/20 text-white border-none text-[9px] font-black uppercase">Charges</Badge>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Dépenses & Achats</p>
                                        <h2 className="text-4xl font-black tracking-tight leading-none">
                                            {data.summary.totalCosts.toLocaleString("fr-FR")}
                                            <span className="text-xs ml-2 opacity-70 italic uppercase tracking-tighter">FBU</span>
                                        </h2>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className={cn("rounded-[2.5rem] border-none shadow-sm text-white overflow-hidden relative",
                                data.summary.netBalance >= 0 ? "bg-gradient-to-br from-slate-800 to-slate-900" : "bg-gradient-to-br from-red-700 to-red-600")}>
                                <div className="absolute -top-10 -right-10 size-40 bg-primary/10 rounded-full blur-3xl" />
                                <CardContent className="p-8 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="size-12 rounded-2xl bg-white/10 flex items-center justify-center">
                                            <Wallet className="size-6" />
                                        </div>
                                        <Badge className="bg-white/10 text-white border-none text-[9px] font-black uppercase">Résultat</Badge>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Balance Nette</p>
                                        <h2 className="text-4xl font-black tracking-tight leading-none">
                                            {data.summary.netBalance.toLocaleString("fr-FR")}
                                            <span className="text-xs ml-2 opacity-70 italic uppercase tracking-tighter">FBU</span>
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold bg-white/10 w-fit px-3 py-1.5 rounded-full">
                                        {data.summary.netBalance >= 0 ? (
                                            <><CheckCircle2 className="size-3" /> Performance Positive</>
                                        ) : (
                                            <>Déficit de Trésorerie</>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Actes vs Pharmacie Tabs */}
                        <div className="flex items-center gap-2">
                            <FileCheck2 className="size-4 text-primary" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">
                                Analyse par Centre de Profit
                            </p>
                        </div>

                        <Tabs defaultValue="acts" className="w-full">
                            <TabsList className="h-12 gap-1 rounded-2xl bg-white border border-border shadow-sm p-1.5">
                                <TabsTrigger value="acts" className="rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-[11px] font-black uppercase tracking-widest px-6">
                                    <Activity className="size-4 mr-1.5" /> Actes Médicaux
                                </TabsTrigger>
                                <TabsTrigger value="pharmacy" className="rounded-xl data-[state=active]:bg-emerald-600 data-[state=active]:text-white text-[11px] font-black uppercase tracking-widest px-6">
                                    <Pill className="size-4 mr-1.5" /> Pharmacie
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="acts" className="mt-6">
                                <ActsPanel acts={data.acts} />
                            </TabsContent>
                            <TabsContent value="pharmacy" className="mt-6">
                                <PharmacyPanel pharmacy={data.pharmacy} />
                            </TabsContent>
                        </Tabs>
                    </>
                ) : (
                    <div className="h-[40vh] flex items-center justify-center text-sm font-bold text-muted-foreground">
                        Aucune donnée disponible sur la période sélectionnée
                    </div>
                )}
            </div>

            {/* Offline A4 Container for printing */}
            <div className="hidden print:block bg-white p-0 m-0">
                <FinanceReportA4 data={data} ref={printRef} />
            </div>
        </div>
    )
}
