"use client"

import { useState, useEffect, useRef } from "react"
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    ShoppingCart,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Printer,
    Calendar,
    Loader2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
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

export default function FinancePage() {
    const [period, setPeriod] = useState("month")
    const [data, setData] = useState<{ summary: FinanceSummary, period: string } | null>(null)
    const [loading, setLoading] = useState(true)
    const printRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchSummary()
    }, [period])

    async function fetchSummary() {
        setLoading(true)
        try {
            const res = await fetch(`/api/finance/summary?period=${period}`)
            const json = await res.json()
            if (res.ok) {
                setData(json.data)
            }
        } catch (err) {
            toast.error("Échec de la récupération des données financières")
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    if (!data && !loading) return null

    return (
        <div className="relative min-h-screen bg-muted/5">
            {/* Dashboard Content - Hidden during print */}
            <div className="p-6 space-y-8 max-w-[1400px] mx-auto print:hidden">
                <PageHeader
                    title="Console Financière"
                    description="Vision holistique des flux de revenus et charges opérationnelles"
                >
                    <div className="flex items-center gap-3">
                        <div className="flex bg-white p-1 rounded-full shadow-sm border border-muted/50">
                            {[
                                { id: "today", label: "Aujourd'hui" },
                                { id: "month", label: "Ce Mois" },
                                { id: "year", label: "Cette Année" }
                            ].map((p) => (
                                <Button
                                    key={p.id}
                                    variant="ghost"
                                    size="sm"
                                    className={cn(
                                        "rounded-full h-8 px-4 text-[10px] font-black uppercase tracking-widest transition-all",
                                        period === p.id
                                            ? "bg-primary text-primary-foreground shadow-lg"
                                            : "text-muted-foreground hover:bg-muted/50"
                                    )}
                                    onClick={() => setPeriod(p.id)}
                                >
                                    {p.label}
                                </Button>
                            ))}
                        </div>
                        <Button
                            className="rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
                            onClick={handlePrint}
                        >
                            <Printer className="size-4 mr-2" /> Rapport A4
                        </Button>
                    </div>
                </PageHeader>

                {loading ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
                        <Loader2 className="size-12 animate-spin text-primary opacity-20" />
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-muted-foreground animate-pulse">Agrégation des flux...</p>
                    </div>
                ) : data && (
                    <>
                        {/* KPI Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="rounded-[2.5rem] border-none shadow-sm bg-gradient-to-br from-emerald-600 to-emerald-500 text-white overflow-hidden relative group">
                                <div className="absolute -top-10 -right-10 size-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
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
                                            {data.summary.totalRevenue.toLocaleString()}
                                            <span className="text-xs ml-2 opacity-70 italic uppercase tracking-tighter">FBU</span>
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold bg-black/10 w-fit px-3 py-1.5 rounded-full">
                                        <ArrowUpRight className="size-3" /> Entrées de flux consolidées
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[2.5rem] border-none shadow-sm bg-gradient-to-br from-rose-600 to-rose-500 text-white overflow-hidden relative group">
                                <div className="absolute -top-10 -right-10 size-40 bg-white/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
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
                                            {data.summary.totalCosts.toLocaleString()}
                                            <span className="text-xs ml-2 opacity-70 italic uppercase tracking-tighter">FBU</span>
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold bg-black/10 w-fit px-3 py-1.5 rounded-full">
                                        <ArrowDownRight className="size-3" /> Sorties d'approvisionnement
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[2.5rem] border-none shadow-sm bg-slate-900 text-white overflow-hidden relative group">
                                <div className="absolute -top-10 -right-10 size-40 bg-primary/10 rounded-full blur-3xl group-hover:scale-125 transition-transform duration-700" />
                                <CardContent className="p-8 space-y-4">
                                    <div className="flex justify-between items-start">
                                        <div className="size-12 rounded-2xl bg-primary flex items-center justify-center">
                                            <Wallet className="size-6 text-white" />
                                        </div>
                                        <Badge className="bg-primary text-white border-none text-[9px] font-black uppercase">Résultat</Badge>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Balance Nette</p>
                                        <h2 className="text-4xl font-black tracking-tight leading-none">
                                            {data.summary.netBalance.toLocaleString()}
                                            <span className="text-xs ml-2 opacity-70 italic uppercase tracking-tighter">FBU</span>
                                        </h2>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-[10px] font-bold bg-white/10 w-fit px-3 py-1.5 rounded-full">
                                        {data.summary.netBalance >= 0 ? "Performance Positive" : "Déficit de Trésorerie"}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Breakdown Sections */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-xl font-black flex items-center gap-3">
                                        <div className="size-10 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                                            <TrendingUp className="size-5" />
                                        </div>
                                        Analyse des Recettes
                                    </CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Répartition sectorielle du chiffre d'affaires</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-slate-800">Ventes Pharmacie</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Comptoir & Ordonnances</p>
                                            </div>
                                            <p className="text-xl font-black text-emerald-600">{data.summary.breakdown.pharmacy.toLocaleString()} FBU</p>
                                        </div>
                                        <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                                            <div
                                                className="bg-emerald-500 h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${(data.summary.breakdown.pharmacy / data.summary.totalRevenue) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-slate-800">Actes Médicaux</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Consultations & Examens</p>
                                            </div>
                                            <p className="text-xl font-black text-emerald-600">{data.summary.breakdown.medicalActs.toLocaleString()} FBU</p>
                                        </div>
                                        <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                                            <div
                                                className="bg-emerald-500/60 h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${(data.summary.breakdown.medicalActs / data.summary.totalRevenue) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                                <CardHeader className="p-8 pb-4">
                                    <CardTitle className="text-xl font-black flex items-center gap-3">
                                        <div className="size-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                                            <TrendingDown className="size-5" />
                                        </div>
                                        Centres de Coûts
                                    </CardTitle>
                                    <CardDescription className="text-[10px] font-bold uppercase tracking-widest">Ventilation des charges par département</CardDescription>
                                </CardHeader>
                                <CardContent className="p-8 space-y-6">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-slate-800">Achats Médicaments</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Approvisionnement Stocks</p>
                                            </div>
                                            <p className="text-xl font-black text-rose-600">{data.summary.breakdown.purchases.toLocaleString()} FBU</p>
                                        </div>
                                        <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                                            <div
                                                className="bg-rose-500 h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${(data.summary.breakdown.purchases / data.summary.totalCosts) * 100}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end">
                                            <div className="space-y-1">
                                                <p className="text-sm font-black text-slate-800">Frais Généraux</p>
                                                <p className="text-[10px] font-bold text-muted-foreground uppercase">Fonctionnement & Maintenance</p>
                                            </div>
                                            <p className="text-xl font-black text-rose-600">{data.summary.breakdown.expenses.toLocaleString()} FBU</p>
                                        </div>
                                        <div className="w-full bg-muted h-3 rounded-full overflow-hidden">
                                            <div
                                                className="bg-rose-500/60 h-full rounded-full transition-all duration-1000"
                                                style={{ width: `${(data.summary.breakdown.expenses / data.summary.totalCosts) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </div>

            {/* Offline A4 Container for printing */}
            <div className="hidden print:block bg-white p-0 m-0">
                <FinanceReportA4 data={data} ref={printRef} />
            </div>
        </div>
    )
}
