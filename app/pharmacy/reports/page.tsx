"use client"

import { useState, useEffect } from "react"
import {
    BarChart3,
    TrendingUp,
    Package,
    AlertTriangle,
    Calendar,
    Search,
    Filter,
    Printer,
    ArrowUpRight,
    ArrowDownRight,
    Pill,
    History,
    Boxes,
    ShoppingCart
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { toast } from "sonner"

interface SaleRecord {
    id: string
    saleDate: string
    customerName: string | null
    totalAmount: string
    status: string
}

interface SummaryData {
    revenue: number
    salesCount: number
    stockValue: number
    lowStockCount: number
}

export default function PharmacyReportsPage() {
    const [startDate, setStartDate] = useState(format(new Date(new Date().setDate(new Date().getDate() - 30)), 'yyyy-MM-dd'))
    const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'))
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<SaleRecord[]>([])
    const [summary, setSummary] = useState<SummaryData | null>(null)
    const [trending, setTrending] = useState<any[]>([])

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await fetch(`/api/pharmacy/reports?startDate=${startDate}&endDate=${endDate}`)
            const json = await res.json()
            if (json.success) {
                setData(json.data)
                setSummary(json.summary)
                setTrending(json.trending)
            }
        } catch (error) {
            toast.error("Erreur lors du chargement des rapports")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [startDate, endDate])

    const handlePrint = () => {
        window.print()
    }

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen">
            {/* Print-only Header */}
            <div className="hidden print:block mb-8 border-b-2 pb-6 border-slate-200">
                <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                        <img src="/images/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tight">CLINIQUE MEDICO-DENTAIRE Le SOURIRE</h1>
                            <p className="text-xs text-slate-500 font-semibold italic">Département Pharmacie</p>
                            <p className="text-[10px] text-slate-400 mt-1 max-w-sm">Africana House, Kigobe, Boulevard Mwambutsa, Bujumbura</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-slate-800 uppercase">Rapport d'Activité Pharmacie</h2>
                        <p className="text-xs text-slate-500 mt-1">Période: {format(new Date(startDate), 'dd/MM/yyyy')} au {format(new Date(endDate), 'dd/MM/yyyy')}</p>
                        <p className="text-[10px] text-slate-400 mt-4 font-bold">Généré le: {format(new Date(), 'dd MMMM yyyy HH:mm', { locale: fr })}</p>
                    </div>
                </div>
            </div>

            <div className="print:hidden">
                <PageHeader
                    title="Rapports Pharmacie"
                    description="Analyse des ventes, valorisation du stock et alertes d'inventaire"
                    action={
                        <Button onClick={handlePrint} className="rounded-2xl gap-2 font-black uppercase text-xs tracking-widest shadow-lg shadow-primary/20">
                            <Printer className="size-4" /> Finaliser & Imprimer
                        </Button>
                    }
                />
            </div>

            {/* Filters */}
            <Card className="print:hidden border-primary/20 bg-primary/5 dark:bg-primary/10 shadow-sm">
                <CardContent className="p-4">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Début de Période</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="pl-10 h-10 rounded-xl border-none shadow-sm focus-visible:ring-primary"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Fin de Période</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="pl-10 h-10 rounded-xl border-none shadow-sm focus-visible:ring-primary"
                                />
                            </div>
                        </div>
                        <Button
                            variant="secondary"
                            className="h-10 rounded-xl px-6 font-bold"
                            onClick={fetchData}
                        >
                            <History className="size-4 mr-2" /> Actualiser
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Top Metrics Hierarchy */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
                    <Card className="border-l-4 border-l-blue-600 shadow-sm bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-900/10">
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-blue-600 tracking-widest mb-1">Chiffre d'Affaires</p>
                                    <h3 className="text-2xl font-black">{Number(summary.revenue).toLocaleString()} <span className="text-xs font-normal">FBU</span></h3>
                                    <p className="text-[10px] text-muted-foreground mt-2">{summary.salesCount} ventes réalisées</p>
                                </div>
                                <div className="bg-blue-600/10 p-2 rounded-xl">
                                    <TrendingUp className="size-5 text-blue-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-600 shadow-sm bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-900 dark:to-purple-900/10">
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-purple-600 tracking-widest mb-1">Valeur du Stock</p>
                                    <h3 className="text-2xl font-black">{Number(summary.stockValue).toLocaleString()} <span className="text-xs font-normal">FBU</span></h3>
                                    <p className="text-[10px] text-muted-foreground mt-2">Évaluation au prix d'achat</p>
                                </div>
                                <div className="bg-purple-600/10 p-2 rounded-xl">
                                    <Boxes className="size-5 text-purple-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-600 shadow-sm bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-900 dark:to-orange-900/10">
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-orange-600 tracking-widest mb-1">Stock Critique</p>
                                    <h3 className="text-2xl font-black">{summary.lowStockCount} <span className="text-xs font-normal">Items</span></h3>
                                    <p className="text-[10px] text-orange-600 font-bold mt-2">Réapprovisionnement requis</p>
                                </div>
                                <div className="bg-orange-600/10 p-2 rounded-xl">
                                    <AlertTriangle className="size-5 text-orange-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-600 shadow-sm bg-gradient-to-br from-white to-green-50/30 dark:from-slate-900 dark:to-green-900/10">
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-[10px] font-black uppercase text-green-600 tracking-widest mb-1">Performance</p>
                                    <h3 className="text-2xl font-black">+{((summary.revenue / (summary.stockValue || 1)) * 100).toFixed(1)}%</h3>
                                    <p className="text-[10px] text-muted-foreground mt-2">Ratio Ventes / Stock</p>
                                </div>
                                <div className="bg-green-600/10 p-2 rounded-xl">
                                    <ArrowUpRight className="size-5 text-green-600" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Trending Items List */}
                <Card className="lg:col-span-1 shadow-lg border-none dark:bg-slate-900/50">
                    <CardHeader className="border-b bg-muted/5">
                        <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <BarChart3 className="size-4 text-primary" />
                            Produits Phares
                        </CardTitle>
                        <CardDescription>Articles les plus vendus sur la période</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y dark:divide-slate-800">
                            {trending.length > 0 ? trending.map((item, i) => (
                                <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-lg bg-primary/10 flex items-center justify-center font-bold text-xs text-primary">
                                            #{i + 1}
                                        </div>
                                        <p className="font-bold text-sm truncate max-w-[150px]">{item.name}</p>
                                    </div>
                                    <Badge variant="secondary" className="px-3 rounded-lg font-black">{item.total_sold} units</Badge>
                                </div>
                            )) : (
                                <div className="p-8 text-center text-xs text-muted-foreground italic">Aucune donnée disponible</div>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Sales Journal */}
                <Card className="lg:col-span-2 shadow-lg border-none dark:bg-slate-900/50">
                    <CardHeader className="border-b bg-muted/5">
                        <div className="flex justify-between items-center">
                            <div>
                                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                    <History className="size-4 text-primary" />
                                    Journal des Ventes
                                </CardTitle>
                                <CardDescription>Historique détaillé des transactions</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="overflow-x-auto">
                            <style jsx global>{`
                                @media print {
                                    body { background: white !important; font-size: 10px; }
                                    .p-6 { padding: 0 !important; }
                                    .shadow-lg { box-shadow: none !important; }
                                    table { width: 100% !important; border-collapse: collapse; }
                                    th, td { border: 1px solid #e2e8f0 !important; padding: 8px 12px !important; }
                                    th { background-color: #f8fafc !important; color: black !important; -webkit-print-color-adjust: exact; }
                                    .print\\:hidden { display: none !important; }
                                    .print\\:grid-cols-4 { display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 10px !important; }
                                    .print\\:block { display: block !important; }
                                }
                            `}</style>
                            <table className="w-full text-sm text-left">
                                <thead className="bg-muted/50 dark:bg-slate-800 text-[11px] font-black uppercase text-muted-foreground tracking-widest border-b">
                                    <tr>
                                        <th className="px-6 py-4">Date & Heure</th>
                                        <th className="px-6 py-4">Client / Référence</th>
                                        <th className="px-6 py-4 text-right">Montant</th>
                                        <th className="px-6 py-4 text-center">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y dark:divide-slate-800">
                                    {loading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <tr key={i} className="animate-pulse">
                                                <td colSpan={4} className="px-6 py-4"><Skeleton className="h-4 w-full" /></td>
                                            </tr>
                                        ))
                                    ) : data.length > 0 ? data.map((sale) => (
                                        <tr key={sale.id} className="hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                                            <td className="px-6 py-4 font-medium text-muted-foreground">
                                                {format(new Date(sale.saleDate), 'dd/MM/yyyy HH:mm')}
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-md">
                                                        <ShoppingCart className="size-3 text-slate-500" />
                                                    </div>
                                                    <span className="font-bold uppercase tracking-tight">{sale.customerName || 'Client de Passage'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">
                                                {Number(sale.totalAmount).toLocaleString()} FBU
                                            </td>
                                            <td className="px-6 py-4 text-center font-black">
                                                <Badge variant="outline" className="border-green-500 text-green-600 bg-green-50/50 uppercase text-[9px] px-2 py-0">
                                                    Confirmé
                                                </Badge>
                                            </td>
                                        </tr>
                                    )) : (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground italic">Aucune vente sur cette période</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
