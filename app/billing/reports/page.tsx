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
    CreditCard
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
    totalPatient: number
    totalInsurance: number
    collected: number
    pending: number
    count: number
}

export default function BillingReportsPage() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState<ReportData[]>([])
    const [summary, setSummary] = useState<Summary | null>(null)
    const [patients, setPatients] = useState<any[]>([])

    // Filters
    const [startDate, setStartDate] = useState(new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0])
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0])
    const [status, setStatus] = useState("all")
    const [paymentMethod, setPaymentMethod] = useState("all")
    const [patientId, setPatientId] = useState("all")

    useEffect(() => {
        fetchReport()
        fetchPatients()
    }, [])

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
                patientId: patientId === 'all' ? '' : patientId
            })
            const res = await fetch(`/api/billing/reports?${params.toString()}`)
            const d = await res.json()
            if (res.ok) {
                setData(d.data || [])
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

    return (
        <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen">
            {/* Print-only Header */}
            <div className="hidden print:block mb-8 border-b-2 pb-6 border-slate-200">
                <div className="flex justify-between items-start">
                    <div className="flex gap-4 items-center">
                        <img src="/images/logo.png" alt="Logo" className="w-16 h-16 object-contain" />
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tight">CLINIQUE MEDICO-DENTAIRE Le SOURIRE</h1>
                            <p className="text-xs text-slate-500 font-semibold italic">Service de Santé d'Excellence</p>
                            <p className="text-[10px] text-slate-400 mt-1 max-w-sm">Africana House, Kigobe, Boulevard Mwambutsa, Bujumbura</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold text-slate-800">RAPPORT DE FACTURATION</h2>
                        <p className="text-xs text-slate-500 mt-1">Période: {format(new Date(startDate), 'dd/MM/yyyy')} au {format(new Date(endDate), 'dd/MM/yyyy')}</p>
                        <p className="text-[10px] text-slate-400 mt-4">Généré le: {format(new Date(), 'dd MMMM yyyy HH:mm', { locale: fr })}</p>
                        <p className="text-[10px] text-slate-400 font-bold">NIF: 500253456</p>
                    </div>
                </div>
            </div>

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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
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
                        <Button className="w-full h-10" onClick={fetchReport} disabled={loading}>
                            {loading ? <Loader2 className="size-4 animate-spin" /> : <Filter className="size-4 mr-2" />}
                            Appliquer les filtres
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Summary Cards */}
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
                                        style={{ width: `${(summary.collected / summary.totalPatient) * 100}%` }}
                                    />
                                </div>
                                <span className="text-[10px] font-bold text-green-600">
                                    {Math.round((summary.collected / summary.totalPatient) * 100)}%
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
                        <style jsx global>{`
                            @media print {
                                body { background: white !important; font-size: 10px; }
                                .p-6 { padding: 0 !important; }
                                .shadow-lg { box-shadow: none !important; }
                                table { width: 100% !important; border-collapse: collapse; }
                                th, td { border: 1px solid #e2e8f0 !important; padding: 6px 12px !important; }
                                th { background-color: #f8fafc !important; color: black !important; -webkit-print-color-adjust: exact; }
                                .bg-muted\\/30 { background: transparent !important; }
                                .bg-gradient-to-br { background: white !important; }
                                .border-l-4 { border-left-width: 8px !important; }
                                .print\\:hidden { display: none !important; }
                                .print\\:grid-cols-4 { display: grid !important; grid-template-columns: repeat(4, 1fr) !important; gap: 10px !important; }
                                .print\\:block { display: block !important; }
                            }
                        `}</style>
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
    )
}
