"use client"

import { useState, useEffect, useRef } from "react"
import {
    TrendingUp,
    TrendingDown,
    Wallet,
    Printer,
    CalendarRange,
    Loader2,
    CheckCircle2
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

interface FinanceData {
    summary: FinanceSummary
    from: string | null
    to: string | null
}

const fmt = (n: number) => `${n.toLocaleString("fr-FR")} FBU`

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
                    description="Suivi des recettes et charges sur une période"
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

                        {/* Detailed flow table */}
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-white overflow-hidden">
                            <CardContent className="p-0">
                                <div className="p-8 pb-4">
                                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Détail des Flux Financiers</p>
                                </div>
                                <div className="px-8 pb-8 space-y-8">
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="size-2 rounded-full bg-emerald-500" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Recettes</p>
                                        </div>
                                        <div className="divide-y divide-slate-100 border-t border-b border-slate-200">
                                            <div className="flex justify-between py-3.5">
                                                <p className="text-sm font-bold text-slate-700">Ventes Pharmacie</p>
                                                <p className="text-sm font-black text-slate-900 tabular-nums">{fmt(data.summary.breakdown.pharmacy)}</p>
                                            </div>
                                            <div className="flex justify-between py-3.5">
                                                <p className="text-sm font-bold text-slate-700">Actes Médicaux & Prestations</p>
                                                <p className="text-sm font-black text-slate-900 tabular-nums">{fmt(data.summary.breakdown.medicalActs)}</p>
                                            </div>
                                            <div className="flex justify-between py-3.5 bg-emerald-50/50 px-4 -mx-4">
                                                <p className="text-sm font-black uppercase text-[10px] tracking-widest text-emerald-700 pt-0.5">Total Recettes</p>
                                                <p className="text-base font-black text-emerald-700 tabular-nums">{fmt(data.summary.totalRevenue)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="size-2 rounded-full bg-rose-500" />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-rose-600">Charges</p>
                                        </div>
                                        <div className="divide-y divide-slate-100 border-t border-b border-slate-200">
                                            <div className="flex justify-between py-3.5">
                                                <p className="text-sm font-bold text-slate-700">Achats Médicaments</p>
                                                <p className="text-sm font-black text-slate-900 tabular-nums">{fmt(data.summary.breakdown.purchases)}</p>
                                            </div>
                                            <div className="flex justify-between py-3.5">
                                                <p className="text-sm font-bold text-slate-700">Frais Opérationnels</p>
                                                <p className="text-sm font-black text-slate-900 tabular-nums">{fmt(data.summary.breakdown.expenses)}</p>
                                            </div>
                                            <div className="flex justify-between py-3.5 bg-rose-50/50 px-4 -mx-4">
                                                <p className="text-sm font-black uppercase text-[10px] tracking-widest text-rose-700 pt-0.5">Total Charges</p>
                                                <p className="text-base font-black text-rose-700 tabular-nums">{fmt(data.summary.totalCosts)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center bg-slate-900 text-white rounded-2xl px-6 py-5">
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60">Résultat Net de la Période</p>
                                        <p className="text-2xl font-black tabular-nums">{fmt(data.summary.netBalance)}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
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
