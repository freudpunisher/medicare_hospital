"use client"

import { useState, useEffect } from "react"
import {
    BarChart3,
    Calendar,
    Search,
    Filter,
    Printer,
    Download,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    Loader2,
    FileText,
    User,
    CreditCard,
    TrendingUp,
    TrendingDown,
    Layers,
    PiggyBank,
    AlertTriangle
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { PrintReport } from "@/components/reports/print-report"
import { useCurrentUser } from "@/hooks/use-current-user"
import { toast } from "sonner"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface ReportData {
    id: string
    invoiceNumber: string
    totalAmount: string
    insuranceAmount: string
    patientAmount: string
    discountAmount: string
    status: string
    createdAt: string
    paymentMethod: string
    patient: {
        id: string
        firstName: string
        lastName: string
    }
}

interface Summary {
    totalBrut: number
    totalDiscount: number
    netRevenue: number
    totalPatient: number
    totalInsurance: number
    collected: number
    pending: number
    count: number
    totalExpenses: number
    profit: number
    margin: number
    serviceCount: number
    filteredService: boolean
}

interface ServiceRow {
    serviceId: string
    serviceName: string
    serviceCode: string
    actCount: number
    lineCount: number
    quantity: number
    gross: number
    discount: number
    net: number
    patient: number
    insurance: number
    collected: number
    pending: number
    share: number
}

interface ExpenseRow {
    category: string
    amount: number
    count: number
}

interface Service {
    id: string
    name: string
}

export default function BillingReportsPage() {
    const { user } = useCurrentUser()
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<ReportData[]>([])
    const [byService, setByService] = useState<ServiceRow[]>([])
    const [expenseRows, setExpenseRows] = useState<ExpenseRow[]>([])
    const [summary, setSummary] = useState<Summary | null>(null)
    const [patients, setPatients] = useState<any[]>([])
    const [services, setServices] = useState<Service[]>([])

    // Filters
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
    const [status, setStatus] = useState("all")
    const [paymentMethod, setPaymentMethod] = useState("all")
    const [patientId, setPatientId] = useState("all")
    const [serviceId, setServiceId] = useState("all")

    useEffect(() => {
        fetchReport()
        fetchPatients()
        fetchServices()
    }, [])

    async function fetchServices() {
        try {
            const res = await fetch("/api/services/list")
            const d = await res.json()
            if (res.ok) setServices(d.data || [])
        } catch (err) { }
    }

    async function fetchPatients() {
        try {
            const res = await fetch("/api/patients/list")
            const d = await res.json()
            if (res.ok) setPatients(d.data || [])
        } catch (err) { }
    }

    async function fetchReport() {
        setLoading(true)
        try {
            const params = new URLSearchParams({
                startDate,
                endDate,
                status,
                paymentMethod,
                patientId: patientId === 'all' ? '' : patientId,
                serviceId: serviceId === 'all' ? '' : serviceId
            })
            const res = await fetch(`/api/billing/reports?${params.toString()}`)
            const d = await res.json()
            if (res.ok) {
                setData(d.data || [])
                setByService(d.byService || [])
                setExpenseRows(d.expenses || [])
                setSummary(d.summary)
            } else {
                toast.error("Erreur lors de la récupération du rapport")
            }
        } catch (err) {
            toast.error("Erreur serveur")
        } finally {
            setLoading(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    const printedBy = user?.fullName ?? user?.username
    // Frozen at mount so the document shows when the report was produced, not
    // when the print dialog was opened.
    const [generatedAt] = useState(() => new Date())

    const fmt = (n: number) => Number(n || 0).toLocaleString()
    const pct = (n: number) => `${Math.round(Number(n) || 0)}%`
    const collectRate = summary && summary.totalPatient > 0
        ? (summary.collected / summary.totalPatient) * 100
        : 0

    return (
        <>
            {/* Dedicated paper document. Hidden on screen, shown only on print. */}
            <PrintReport
                data={data}
                byService={byService}
                expenseRows={expenseRows}
                summary={summary}
                services={services}
                generatedAt={generatedAt}
                printedBy={printedBy}
                filters={{ startDate, endDate, status, paymentMethod, serviceId }}
            />

            <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen rp-scope-off">
            <div className="print:hidden">
                <PageHeader
                    title="Rapports de Facturation"
                    description="Analyse détaillée des revenus et des paiements"
                >
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handlePrint}>
                            <Printer className="size-4 mr-2" />
                            Imprimer
                        </Button>
                        <Button>
                            <Download className="size-4 mr-2" />
                            Exporter Excel
                        </Button>
                    </div>
                </PageHeader>
            </div>

            {/* Filters */}
            <Card className="print:hidden border-primary/20 bg-primary/5 dark:bg-primary/10 shadow-sm">
                <CardContent className="p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 items-end">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Début</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    className="pl-10"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Fin</label>
                            <div className="relative">
                                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                <Input
                                    type="date"
                                    className="pl-10"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Statut</label>
                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tous les statuts" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les statuts</SelectItem>
                                    <SelectItem value="paid">Payé</SelectItem>
                                    <SelectItem value="pending">En attente</SelectItem>
                                    <SelectItem value="cancelled">Annulé</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Paiement</label>
                            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tous les modes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les modes</SelectItem>
                                    <SelectItem value="cash">Espèces</SelectItem>
                                    <SelectItem value="mobile_money">Mobile Money</SelectItem>
                                    <SelectItem value="card">Carte</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase text-muted-foreground ml-1">Service</label>
                            <Select value={serviceId} onValueChange={setServiceId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Tous les services" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">Tous les services</SelectItem>
                                    {services.map((s) => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button className="w-full h-10" onClick={fetchReport} disabled={loading}>
                            {loading ? <Loader2 className="size-4 animate-spin" /> : <Filter className="size-4 mr-2" />}
                            Appliquer les filtres
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
            {summary?.filteredService && (
                <div className="print:hidden flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-950/30 dark:border-amber-800 px-4 py-3">
                    <AlertTriangle className="size-4 text-amber-600 mt-0.5 shrink-0" />
                    <p className="text-xs text-amber-800 dark:text-amber-200">
                        <span className="font-bold">Filtre service actif.</span> Le chiffre d'affaires et la marge par
                        service sont fiables, mais les <span className="font-bold">dépenses ne sont rattachées à aucun
                        service</span> — elles restent le total de la période. Le résultat net affiché n'est donc pas un
                        profit propre à ce service. Retirez le filtre pour obtenir le compte de résultat réel.
                    </p>
                </div>
            )}

            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
                    <Card className="border-l-4 border-l-emerald-500 shadow-sm overflow-hidden bg-gradient-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-900/10">
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Chiffre d'Affaires Net</p>
                                    <h3 className="text-2xl font-black mt-1">{fmt(summary.netRevenue)} <span className="text-xs text-muted-foreground">FBU</span></h3>
                                </div>
                                <div className="bg-emerald-100 p-2 rounded-lg">
                                    <TrendingUp className="size-5 text-emerald-600" />
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-4 font-bold uppercase tracking-wider">
                                {fmt(summary.serviceCount)} service{summary.serviceCount > 1 ? 's' : ''} · brut {fmt(summary.totalBrut)}
                                {summary.totalDiscount > 0 ? ` · rem. ${fmt(summary.totalDiscount)}` : ''}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-red-500 shadow-sm overflow-hidden bg-gradient-to-br from-white to-red-50/30 dark:from-slate-900 dark:to-red-900/10">
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Dépenses de la Période</p>
                                    <h3 className="text-2xl font-black mt-1 text-red-700">{fmt(summary.totalExpenses)} <span className="text-xs text-muted-foreground">FBU</span></h3>
                                </div>
                                <div className="bg-red-100 p-2 rounded-lg">
                                    <PiggyBank className="size-5 text-red-600" />
                                </div>
                            </div>
                            <p className="text-[10px] text-red-600 font-bold mt-4 italic uppercase">
                                {expenseRows.length} catégorie{expenseRows.length > 1 ? 's' : ''} de charges
                            </p>
                        </CardContent>
                    </Card>

                    <Card className={`border-l-4 shadow-sm overflow-hidden bg-gradient-to-br from-white ${summary.profit >= 0 ? 'border-l-emerald-500 to-emerald-50/30 dark:to-emerald-900/10' : 'border-l-red-500 to-red-50/30 dark:to-red-900/10'}`}>
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Résultat Net</p>
                                    <h3 className={`text-2xl font-black mt-1 ${summary.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {fmt(summary.profit)} <span className="text-xs text-muted-foreground">FBU</span>
                                    </h3>
                                </div>
                                <div className={`p-2 rounded-lg ${summary.profit >= 0 ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                    {summary.profit >= 0
                                        ? <ArrowUpRight className="size-5 text-emerald-600" />
                                        : <ArrowDownRight className="size-5 text-red-600" />}
                                </div>
                            </div>
                            <p className="text-[10px] text-muted-foreground mt-4 italic uppercase">CA Net moins Dépenses</p>
                        </CardContent>
                    </Card>

                    <Card className={`border-l-4 shadow-sm overflow-hidden bg-gradient-to-br from-white ${summary.margin >= 0 ? 'border-l-indigo-500 to-indigo-50/30 dark:to-indigo-900/10' : 'border-l-red-500 to-red-50/30 dark:to-red-900/10'}`}>
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Marge Nette</p>
                                    <h3 className={`text-2xl font-black mt-1 ${summary.margin >= 0 ? 'text-indigo-700' : 'text-red-700'}`}>
                                        {pct(summary.margin)}
                                    </h3>
                                </div>
                                <div className={`p-2 rounded-lg ${summary.margin >= 0 ? 'bg-indigo-100' : 'bg-red-100'}`}>
                                    {summary.margin >= 0
                                        ? <Layers className="size-5 text-indigo-600" />
                                        : <TrendingDown className="size-5 text-red-600" />}
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <div className="h-1.5 flex-1 bg-indigo-100 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${summary.margin >= 0 ? 'bg-indigo-500' : 'bg-red-500'}`}
                                        style={{ width: `${Math.min(Math.abs(summary.margin), 100)}%` }}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Secondary summary */}
            {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 print:grid-cols-4">
                    <Card className="border-l-4 border-l-blue-500 shadow-sm overflow-hidden bg-gradient-to-br from-white to-blue-50/30 dark:from-slate-900 dark:to-blue-900/10">
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Chiffre d'Affaires Brut</p>
                                    <h3 className="text-2xl font-black mt-1">{summary.totalBrut.toLocaleString()} <span className="text-xs text-muted-foreground">FBU</span></h3>
                                </div>
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <BarChart3 className="size-5 text-blue-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-1 text-[10px] text-blue-600 font-bold uppercase tracking-wider bg-blue-100/50 w-fit px-2 py-0.5 rounded-full">
                                <FileText className="size-3" />
                                {summary.count} Factures
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-green-500 shadow-sm overflow-hidden bg-gradient-to-br from-white to-green-50/30 dark:from-slate-900 dark:to-green-900/10">
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Total Encaissé (Patient)</p>
                                    <h3 className="text-2xl font-black mt-1 text-green-700">{summary.collected.toLocaleString()} <span className="text-xs text-muted-foreground">FBU</span></h3>
                                </div>
                                <div className="bg-green-100 p-2 rounded-lg">
                                    <ArrowUpRight className="size-5 text-green-600" />
                                </div>
                            </div>
                            <div className="mt-4 flex items-center gap-2">
                                <div className="h-1.5 flex-1 bg-green-100 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-green-500"
                                        style={{ width: `${Math.min(collectRate, 100)}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-bold text-green-600">
                                    {pct(collectRate)}
                                </span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-orange-500 shadow-sm overflow-hidden bg-gradient-to-br from-white to-orange-50/30 dark:from-slate-900 dark:to-orange-900/10">
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Reste à Recouvrer</p>
                                    <h3 className="text-2xl font-black mt-1 text-orange-700">{summary.pending.toLocaleString()} <span className="text-xs text-muted-foreground">FBU</span></h3>
                                </div>
                                <div className="bg-orange-100 p-2 rounded-lg">
                                    <ArrowDownRight className="size-5 text-orange-600" />
                                </div>
                            </div>
                            <p className="text-[10px] text-orange-600 font-bold mt-4 italic uppercase">Paiements Patients Suspendus</p>
                        </CardContent>
                    </Card>

                    <Card className="border-l-4 border-l-purple-500 shadow-sm overflow-hidden bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-900 dark:to-purple-900/10">
                        <CardContent className="p-5">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground">Dette Mutuelle (Assurance)</p>
                                    <h3 className="text-2xl font-black mt-1 text-purple-700">{summary.totalInsurance.toLocaleString()} <span className="text-xs text-muted-foreground">FBU</span></h3>
                                </div>
                                <div className="bg-purple-100 p-2 rounded-lg">
                                    <Wallet className="size-5 text-purple-600" />
                                </div>
                            </div>
                            <p className="text-[10px] text-purple-600 font-bold mt-4 italic uppercase">Montants à Bordereaux</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Revenue by service */}
            <Card className="shadow-lg border-none dark:bg-slate-900/50">
                <CardHeader className="bg-muted/30 dark:bg-slate-800/50 pb-4 print:bg-white border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Layers className="size-5 text-primary" />
                                Gain par Service
                            </CardTitle>
                            <CardDescription>
                                {summary?.filteredService
                                    ? `Chiffre d'affaires du service sélectionné`
                                    : "Chiffre d'affaires ventilé par service, avec la part de chaque service dans le total"}
                            </CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-white px-3 py-1 font-bold">
                            {byService.length} Service{byService.length > 1 ? 's' : ''}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 dark:bg-slate-800 text-[10px] font-bold uppercase text-muted-foreground tracking-wider border-b">
                                <tr>
                                    <th className="px-4 py-3">Service</th>
                                    <th className="px-4 py-3 text-center">Actes</th>
                                    <th className="px-4 py-3 text-center">Qté</th>
                                    <th className="px-4 py-3 text-right">CA Brut</th>
                                    <th className="px-4 py-3 text-right">Remise</th>
                                    <th className="px-4 py-3 text-right">CA Net</th>
                                    <th className="px-4 py-3 text-right">Part</th>
                                    <th className="px-4 py-3 text-right">Assurance</th>
                                    <th className="px-4 py-3 text-right">Reste</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={9} className="px-4 py-3">
                                                <div className="h-4 bg-muted dark:bg-slate-800 rounded w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : byService.length > 0 ? (
                                    <>
                                        {byService.map((s) => (
                                            <tr key={s.serviceId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="bg-primary/10 p-1.5 rounded-lg">
                                                            <Layers className="size-3 text-primary" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="font-bold truncate">{s.serviceName}</p>
                                                            <p className="text-[10px] text-muted-foreground font-mono">{s.serviceCode}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-center font-semibold text-muted-foreground">{s.actCount}</td>
                                                <td className="px-4 py-3 text-center font-semibold text-muted-foreground">{fmt(s.quantity)}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-slate-600 dark:text-slate-400">{fmt(s.gross)}</td>
                                                <td className="px-4 py-3 text-right text-orange-600 font-semibold">
                                                    {s.discount > 0 ? `-${fmt(s.discount)}` : '—'}
                                                </td>
                                                <td className="px-4 py-3 text-right font-black">{fmt(s.net)}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <div className="flex items-center gap-2 justify-end">
                                                        <div className="h-1.5 w-14 bg-muted rounded-full overflow-hidden">
                                                            <div className="h-full bg-primary" style={{ width: `${Math.min(s.share, 100)}%` }} />
                                                        </div>
                                                        <span className="text-[10px] font-bold text-muted-foreground w-9 text-right">{pct(s.share)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-right font-semibold text-purple-600">{fmt(s.insurance)}</td>
                                                <td className="px-4 py-3 text-right font-semibold text-orange-600">{s.pending > 0 ? fmt(s.pending) : '—'}</td>
                                            </tr>
                                        ))}
                                        <tr className="bg-muted/60 dark:bg-slate-800/70 font-black border-t-2">
                                            <td className="px-4 py-3 uppercase text-xs">Total</td>
                                            <td className="px-4 py-3 text-center text-xs">—</td>
                                            <td className="px-4 py-3 text-center text-xs">—</td>
                                            <td className="px-4 py-3 text-right text-xs">{fmt(summary?.totalBrut ?? 0)}</td>
                                            <td className="px-4 py-3 text-right text-xs text-orange-600">-{fmt(summary?.totalDiscount ?? 0)}</td>
                                            <td className="px-4 py-3 text-right text-xs">{fmt(summary?.netRevenue ?? 0)}</td>
                                            <td className="px-4 py-3 text-right text-xs">100%</td>
                                            <td className="px-4 py-3 text-right text-xs text-purple-600">{fmt(summary?.totalInsurance ?? 0)}</td>
                                            <td className="px-4 py-3 text-right text-xs text-orange-600">{fmt(summary?.pending ?? 0)}</td>
                                        </tr>
                                    </>
                                ) : (
                                    <tr>
                                        <td colSpan={9} className="px-4 py-10 text-center text-muted-foreground italic">
                                            Aucun revenu enregistré pour cette période.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Expenses & profit for the period */}
            {summary && (
                <Card className="shadow-lg border-none dark:bg-slate-900/50">
                    <CardHeader className="bg-muted/30 dark:bg-slate-800/50 pb-4 print:bg-white border-b">
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <PiggyBank className="size-5 text-primary" />
                                    Dépenses & Résultat
                                </CardTitle>
                                <CardDescription>
                                    Charges de la période et bénéfice net réalisé
                                </CardDescription>
                            </div>
                            <Badge variant="outline" className="bg-white px-3 py-1 font-bold">
                                {expenseRows.length} Catégorie{expenseRows.length > 1 ? 's' : ''}
                            </Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="grid grid-cols-1 lg:grid-cols-2">
                            <div className="overflow-x-auto border-b lg:border-b-0 lg:border-r dark:border-slate-800">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted/50 dark:bg-slate-800 text-[10px] font-bold uppercase text-muted-foreground tracking-wider border-b">
                                        <tr>
                                            <th className="px-4 py-3">Catégorie de Dépense</th>
                                            <th className="px-4 py-3 text-center">Nbr</th>
                                            <th className="px-4 py-3 text-right">Montant</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {expenseRows.length > 0 ? expenseRows.map((e, i) => (
                                            <tr key={`${e.category}-${i}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="px-4 py-3 font-semibold">{e.category}</td>
                                                <td className="px-4 py-3 text-center text-muted-foreground">{e.count}</td>
                                                <td className="px-4 py-3 text-right font-bold text-red-600">{fmt(e.amount)}</td>
                                            </tr>
                                        )) : (
                                            <tr>
                                                <td colSpan={3} className="px-4 py-8 text-center text-muted-foreground italic">
                                                    Aucune dépense enregistrée sur la période.
                                                </td>
                                            </tr>
                                        )}
                                        <tr className="bg-muted/60 dark:bg-slate-800/70 font-black border-t-2">
                                            <td className="px-4 py-3 uppercase text-xs">Total Dépenses</td>
                                            <td className="px-4 py-3 text-center text-xs">—</td>
                                            <td className="px-4 py-3 text-right text-xs text-red-600">{fmt(summary.totalExpenses)}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="p-6 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-medium">Chiffre d'affaires net</span>
                                    <span className="font-bold">{fmt(summary.netRevenue)} FBU</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-muted-foreground font-medium">moins Dépenses</span>
                                    <span className="font-bold text-red-600">- {fmt(summary.totalExpenses)} FBU</span>
                                </div>
                                <Separator />
                                <div className={`flex justify-between items-center p-4 rounded-xl ${summary.profit >= 0 ? 'bg-emerald-50 dark:bg-emerald-950/40' : 'bg-red-50 dark:bg-red-950/40'}`}>
                                    <div className="flex items-center gap-2">
                                        {summary.profit >= 0
                                            ? <TrendingUp className="size-5 text-emerald-600" />
                                            : <TrendingDown className="size-5 text-red-600" />}
                                        <span className="font-black uppercase text-xs tracking-wider">Résultat Net</span>
                                    </div>
                                    <span className={`text-xl font-black ${summary.profit >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                                        {fmt(summary.profit)} FBU
                                    </span>
                                </div>
                                <div className="flex justify-between items-center text-[11px] text-muted-foreground pt-1">
                                    <span>Marge nette sur le CA</span>
                                    <span className="font-bold">{pct(summary.margin)}</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground italic pt-2 border-t">
                                    {summary.filteredService
                                        ? "Service sélectionné : les dépenses restent le total de la période (les charges ne sont pas rattachées à un service). Le résultat net ci-dessous n'est donc pas un profit propre au service."
                                        : "Les dépenses sont saisies par catégorie et ne sont pas rattachées à un service : le résultat net est donc calculé au niveau de la période."}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Results Table */}
            <Card className="shadow-lg border-none dark:bg-slate-900/50">
                <CardHeader className="bg-muted/30 dark:bg-slate-800/50 pb-4 print:bg-white border-b">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <FileText className="size-5 text-primary" />
                                Détails des Invoices
                            </CardTitle>
                            <CardDescription>Liste exhaustive des transactions pour la période sélectionnée</CardDescription>
                        </div>
                        <Badge variant="outline" className="bg-white px-3 py-1 font-bold">
                            {data.length} Résultats
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted/50 dark:bg-slate-800 text-[11px] font-bold uppercase text-muted-foreground tracking-wider border-b">
                                <tr>
                                    <th className="px-6 py-4">Date</th>
                                    <th className="px-6 py-4">Facture No</th>
                                    <th className="px-6 py-4">Patient</th>
                                    <th className="px-6 py-4">Mode</th>
                                    <th className="px-6 py-4 text-right">Montant Brut</th>
                                    <th className="px-6 py-4 text-right">Patient</th>
                                    <th className="px-6 py-4 text-right">Assurance</th>
                                    <th className="px-6 py-4 text-center">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td colSpan={8} className="px-6 py-4">
                                                <div className="h-4 bg-muted dark:bg-slate-800 rounded w-full"></div>
                                            </td>
                                        </tr>
                                    ))
                                ) : data.length > 0 ? (
                                    data.map((row) => (
                                        <tr key={row.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap font-medium text-muted-foreground">
                                                {format(new Date(row.createdAt), 'dd MMM yyyy HH:mm', { locale: fr })}
                                            </td>
                                            <td className="px-6 py-4 font-black text-slate-700 dark:text-slate-200">#{row.invoiceNumber}</td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="bg-slate-100 dark:bg-slate-800 p-1.5 rounded-full">
                                                        <User className="size-3 text-slate-500" />
                                                    </div>
                                                    <span className="font-semibold uppercase truncate max-w-[150px] dark:text-slate-300">
                                                        {row.patient.firstName} {row.patient.lastName}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-1.5">
                                                    <CreditCard className="size-3 text-primary/60" />
                                                    <span className="capitalize">{row.paymentMethod?.replace('_', ' ') || '--'}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-right font-bold text-slate-600 dark:text-slate-400">
                                                {parseFloat(row.totalAmount).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">
                                                {parseFloat(row.patientAmount).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right font-semibold text-purple-600">
                                                {parseFloat(row.insuranceAmount).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                <Badge
                                                    className={`
                            ${row.status === 'paid' ? 'bg-green-100 text-green-700 border-green-200' :
                                                            row.status === 'pending' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                                                                'bg-red-100 text-red-700 border-red-200'}
                            px-2 py-0 border font-bold text-[10px] uppercase
                          `}
                                                >
                                                    {row.status === 'paid' ? 'Payé' : row.status === 'pending' ? 'En attente' : 'Annulé'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground italic">
                                            Aucune donnée trouvée pour cette période.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
            </div>
        </>
    )
}
