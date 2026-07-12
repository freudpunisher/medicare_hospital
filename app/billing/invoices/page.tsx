"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import {
    Search,
    Filter,
    Receipt,
    User,
    CreditCard,
    Banknote,
    Smartphone,
    ShieldCheck,
    Calendar,
    ChevronRight,
    ArrowRight,
    Printer,
    MoreVertical,
    CheckCircle2,
    Clock,
    AlertCircle,
    Ban,
    Eye,
    ListFilter,
    Loader2,
    Landmark
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { InvoiceA4 } from "@/components/billing/invoice-a4"
import { toast } from "sonner"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"

interface Invoice {
    id: string
    invoiceNumber: string
    totalAmount: string
    insuranceAmount: string
    patientAmount: string
    status: 'pending' | 'paid' | 'partial' | 'cancelled'
    createdAt: string
    paymentMethod: string | null
    patient: {
        id: string
        firstName: string
        lastName: string
        gender: string
    }
}

export default function InvoicesPage() {
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null)
    const [viewingInvoice, setViewingInvoice] = useState<any>(null)
    const [detailsLoading, setDetailsLoading] = useState(false)
    const [showDetails, setShowDetails] = useState(false)
    const [paymentMethod, setPaymentMethod] = useState<string>("cash")
    const [paymentReference, setPaymentReference] = useState("")
    const [isPaying, setIsPaying] = useState(false)
    const [openSessions, setOpenSessions] = useState<any[]>([])
    const [selectedSessionId, setSelectedSessionId] = useState<string>("")
    const [cancelOpen, setCancelOpen] = useState(false)
    const [cancelReason, setCancelReason] = useState("")
    const [isCancelling, setIsCancelling] = useState(false)
    const [cancellingInvoice, setCancellingInvoice] = useState<any | null>(null)
    const printRef = useRef<HTMLDivElement>(null)
    const receiptRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        async function fetchInvoices() {
            try {
                const [invRes, sessRes] = await Promise.all([
                    fetch('/api/billing/invoices/list'),
                    fetch('/api/finance/cash-sessions?status=open')
                ])
                const invData = await invRes.json()
                if (invData.success) {
                    setInvoices(invData.data)
                }
                const sessData = await sessRes.json()
                if (sessRes.ok) {
                    const sessions = sessData.data || []
                    setOpenSessions(sessions)
                    if (sessions.length > 0) setSelectedSessionId(sessions[0].id)
                }
            } catch (error) {
                console.error('Failed to fetch initial data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchInvoices()
    }, [])

    const handlePrintA4 = (invoice: Invoice) => {
        setPrintingInvoice(invoice)
        // Wait for state to reflect in DOM
        setTimeout(() => {
            window.print()
        }, 100)
    }

    const handleViewDetails = async (id: string) => {
        setDetailsLoading(true)
        setShowDetails(true)
        setPaymentMethod('cash')
        setPaymentReference('')
        if (openSessions.length > 0) setSelectedSessionId(openSessions[0].id)
        try {
            const res = await fetch(`/api/billing/invoices/${id}`)
            const data = await res.json()
            if (data.success) {
                setViewingInvoice(data.data)
            } else {
                toast.error("Échec du chargement des détails")
                setShowDetails(false)
            }
        } catch (err) {
            toast.error("Erreur de connexion")
            setShowDetails(false)
        } finally {
            setDetailsLoading(false)
        }
    }

    const handleCancel = async () => {
        if (!cancellingInvoice || !cancelReason.trim()) return
        setIsCancelling(true)
        try {
            const res = await fetch(`/api/billing/invoices/${cancellingInvoice.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'cancelled', cancellationReason: cancelReason.trim() }),
            })
            const data = await res.json()
            if (!data.success) {
                toast.error(data.error || "Échec de l'annulation")
                return
            }
            toast.success('Facture annulée')
            setCancelOpen(false)
            setCancelReason('')
            setCancellingInvoice(null)
            setShowDetails(false)
            const listRes = await fetch('/api/billing/invoices/list')
            const listData = await listRes.json()
            if (listData.success) setInvoices(listData.data)
        } catch (err) {
            toast.error("Erreur lors de l'annulation")
        } finally {
            setIsCancelling(false)
        }
    }

    const handlePayment = async () => {
        if (!viewingInvoice) return
        setIsPaying(true)
        try {
            const res = await fetch(`/api/billing/invoices/${viewingInvoice.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    paymentMethod,
                    paymentReference: paymentMethod === 'mobile_money' ? paymentReference : null,
                    amount: viewingInvoice.patientAmount,
                    cashSessionId: selectedSessionId || null,
                })
            })
            const data = await res.json()
            if (!data.success) {
                toast.error(data.error || 'Échec du paiement')
                return
            }

            toast.success('Paiement enregistré avec succès')
            setShowDetails(false)

            // Refresh invoice list
            const listRes = await fetch('/api/billing/invoices/list')
            const listData = await listRes.json()
            if (listData.success) setInvoices(listData.data)
        } catch (err) {
            toast.error('Erreur lors du paiement')
        } finally {
            setIsPaying(false)
        }
    }

    const handleThermalPrint = useCallback((invoiceData: any) => {
        if (!invoiceData) return

        const receiptHtml = receiptRef.current?.innerHTML
        if (!receiptHtml) return

        const win = window.open('', '_blank', 'width=800,height=900')
        if (!win) return

        win.document.write(`
            <html>
                <head>
                    <title>Reçu - ${invoiceData.invoiceNumber}</title>
                    <style>
                        * { box-sizing: border-box; margin: 0; padding: 0; }
                        html { height: auto; }
                        body {
                            font-family: 'Courier New', Courier, monospace;
                            font-size: 11px;
                            font-weight: 400;
                            background: #fff;
                            width: 72mm;
                            max-width: 72mm;
                            padding: 0;
                            margin: 0;
                            line-height: 1.25;
                        }
                        .receipt-container {
                            width: 72mm;
                            padding: 2mm;
                            margin: 0;
                            background: #fff;
                        }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: 700; }
                        .font-black { font-weight: 900; }
                        .uppercase { text-transform: uppercase; }
                        .italic { font-style: italic; }
                        .mt-1 { margin-top: 2px; }
                        .mb-2 { margin-bottom: 4px; }
                        
                        hr {
                            border: 0;
                            border-top: 1px dashed #000;
                            margin: 4px 0;
                            height: 0;
                        }
                        
                        .info-table, .receipt-table, .total-table {
                            width: 100%;
                            border-collapse: collapse;
                            margin: 3px 0;
                            table-layout: fixed;
                        }
                        .info-table td, .receipt-table td, .receipt-table th, .total-table td {
                            font-family: 'Courier New', Courier, monospace;
                            font-size: 11px;
                            line-height: 1.25;
                            padding: 1px 0;
                            vertical-align: top;
                        }
                        
                        .info-table td.lbl {
                            text-align: left;
                            width: 32%;
                        }
                        .info-table td.val {
                            text-align: right;
                            width: 68%;
                            font-weight: bold;
                            word-break: break-word;
                            overflow-wrap: break-word;
                        }
                        
                        .receipt-table th {
                            border-bottom: 1px solid #000;
                            font-weight: 700;
                        }
                        .receipt-table td.act-name {
                            word-break: break-word;
                            overflow-wrap: break-word;
                        }
                        
                        .total-table td.lbl {
                            text-align: left;
                            width: 50%;
                        }
                        .total-table td.val {
                            text-align: right;
                            width: 50%;
                            font-weight: bold;
                        }
                        .total-table tr.pay-row td {
                            font-size: 15px;
                            font-weight: 900;
                            border-top: 1px solid #000;
                            border-bottom: 1px solid #000;
                            padding: 3px 0;
                        }
                        #print-content { display: block; width: 100%; }
                        @media print {
                            @page { size: auto; margin: 0mm; }
                            html, body {
                                height: auto !important;
                                min-height: 0 !important;
                                margin: 0 !important;
                                padding: 0 !important;
                                width: 72mm !important;
                                overflow: visible !important;
                            }
                            #print-content { page-break-after: avoid; break-after: avoid; }
                        }
                    </style>
                </head>
                <body onload="setTimeout(() => { window.print(); window.close(); }, 200)">
                    <div id="print-content">${receiptHtml}</div>
                </body>
            </html>
        `)
        win.document.close()
    }, [])

    const filteredInvoices = useMemo(() => {
        return invoices.filter(inv =>
            inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            `${inv.patient.firstName} ${inv.patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase())
        )
    }, [invoices, searchQuery])

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-success/10 text-success border-none uppercase text-[10px]"><CheckCircle2 className="size-3 mr-1" /> Payée</Badge>
            case 'partial':
                return <Badge className="bg-warning/10 text-warning border-none uppercase text-[10px]"><Clock className="size-3 mr-1" /> Partiel</Badge>
            case 'pending':
                return <Badge className="bg-muted text-muted-foreground border-none uppercase text-[10px]"><AlertCircle className="size-3 mr-1" /> En attente</Badge>
            case 'cancelled':
                return <Badge variant="destructive" className="uppercase text-[10px]">Annulée</Badge>
            default:
                return <Badge variant="outline">{status}</Badge>
        }
    }

    const getPaymentIcon = (method: string | null) => {
        if (!method) return <Badge variant="outline" className="text-[9px]">N/A</Badge>

        switch (method.toLowerCase()) {
            case 'cash':
                return <div className="flex items-center gap-1.5 text-success font-bold"><Banknote className="size-3.5" /> <span className="text-[10px] uppercase">Espèces</span></div>
            case 'card':
                return <div className="flex items-center gap-1.5 text-primary font-bold"><CreditCard className="size-3.5" /> <span className="text-[10px] uppercase">Carte</span></div>
            case 'mobile_money':
                return <div className="flex items-center gap-1.5 text-amber-600 font-bold"><Smartphone className="size-3.5" /> <span className="text-[10px] uppercase">Mobile</span></div>
            default:
                return <span className="text-[10px] uppercase font-bold">{method}</span>
        }
    }

    return (
        <div className="p-6 space-y-6">


            <PageHeader
                title="Journal des Factures"
                description="Consultez et gérez l'historique complet des facturations"
            />
            <div className="bg-primary/5 rounded-[2rem] p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary rotate-3">
                        <Receipt className="size-6" />
                    </div>
                    <div>
                        <h3 className="font-black text-primary uppercase text-sm tracking-widest leading-none">Aperçu Global</h3>
                        <p className="text-[11px] text-muted-foreground mt-1">Totalisation des flux financiers facturés</p>
                    </div>
                </div>
                <div className="flex gap-10 pr-10">
                    <div className="text-right">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Encaissé Patients</p>
                        <p className="text-xl font-black text-foreground">{invoices.reduce((sum, inv) => sum + Number(inv.patientAmount), 0).toLocaleString()} <span className="text-xs font-normal">FBU</span></p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Dû par Mutuelles</p>
                        <p className="text-xl font-black text-amber-600">{invoices.reduce((sum, inv) => sum + Number(inv.insuranceAmount), 0).toLocaleString()} <span className="text-xs font-normal">FBU</span></p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <Input
                        placeholder="Rechercher par numéro de facture ou nom patient..."
                        className="pl-12 h-12 rounded-2xl border-none shadow-sm bg-card/50 backdrop-blur-sm focus-visible:ring-primary"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Button variant="outline" className="h-12 px-6 rounded-2xl gap-2 border-none shadow-sm bg-card/50">
                    <Filter className="size-4" />
                    Filtres
                </Button>
            </div>

            <Card className="rounded-[2.5rem] border-none shadow-xl bg-card/40 backdrop-blur-md overflow-hidden">
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow className="border-none hover:bg-transparent">
                            <TableHead className="font-black text-xs uppercase tracking-wider pl-8 py-6">Facture</TableHead>
                            <TableHead className="font-black text-xs uppercase tracking-wider py-6">Patient</TableHead>
                            <TableHead className="font-black text-xs uppercase tracking-wider py-6">Méthode</TableHead>
                            <TableHead className="font-black text-xs uppercase tracking-wider py-6 text-right">Part Assur. <span className="text-[9px] font-normal lowercase">(Dette)</span></TableHead>
                            <TableHead className="font-black text-xs uppercase tracking-wider py-6 text-right">Part Patient</TableHead>
                            <TableHead className="font-black text-xs uppercase tracking-wider py-6 text-right">Total Facturé</TableHead>
                            <TableHead className="font-black text-xs uppercase tracking-wider py-6 text-center">Statut</TableHead>
                            <TableHead className="pr-8 py-6"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i} className="border-b border-border/40">
                                    <TableCell className="pl-8 py-4"><Skeleton className="h-4 w-24" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                    <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                    <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                                    <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
                                    <TableCell className="pr-8"><Skeleton className="size-8 rounded-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredInvoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-60 text-center text-muted-foreground italic">
                                    <div className="flex flex-col items-center gap-3">
                                        <Receipt className="size-12 opacity-20" />
                                        Aucune facture trouvée.
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredInvoices.map((inv) => (
                                <TableRow key={inv.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors group">
                                    <TableCell className="pl-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="font-black text-foreground group-hover:text-primary transition-colors">{inv.invoiceNumber}</span>
                                            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
                                                <Calendar className="size-3" />
                                                {format(new Date(inv.createdAt), 'dd MMMM yyyy', { locale: fr })}
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                                                <User className="size-5 text-primary" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm">{inv.patient.firstName} {inv.patient.lastName}</span>
                                                <span className="text-[10px] uppercase text-muted-foreground tracking-tighter">{inv.patient.gender === 'male' ? 'Homme' : 'Femme'}</span>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        {getPaymentIcon(inv.paymentMethod)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end">
                                            <span className={`text-sm font-black ${Number(inv.insuranceAmount) > 0 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                                                {Number(inv.insuranceAmount).toLocaleString()}
                                            </span>
                                            {Number(inv.insuranceAmount) > 0 && (
                                                <div className="flex items-center gap-1 text-[9px] text-amber-600/70 uppercase font-black">
                                                    <ShieldCheck className="size-2.5" /> En attente
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className="text-sm font-bold text-foreground">
                                            {Number(inv.patientAmount).toLocaleString()}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="bg-muted px-2 py-1 rounded-lg inline-block">
                                            <span className="text-sm font-black text-foreground">
                                                {Number(inv.totalAmount).toLocaleString()}
                                            </span>
                                            <span className="text-[9px] text-muted-foreground ml-1">FBU</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {getStatusBadge(inv.status)}
                                    </TableCell>
                                    <TableCell className="pr-8 text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                                                    <MoreVertical className="size-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="rounded-2xl w-48 shadow-2xl border-none">
                                                <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground">Options</DropdownMenuLabel>
                                                <DropdownMenuItem
                                                    className="rounded-xl gap-2 font-bold focus:bg-primary/10 cursor-pointer"
                                                    onClick={() => handlePrintA4(inv)}
                                                >
                                                    <Printer className="size-4" /> Imprimer A4
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                    className="rounded-xl gap-2 font-bold focus:bg-primary/10 cursor-pointer"
                                                    onClick={() => handleViewDetails(inv.id)}
                                                >
                                                    <Eye className="size-4" /> Voir Détails
                                                </DropdownMenuItem>
                                                {inv.status !== 'cancelled' && (
                                                    <>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            className="rounded-xl gap-2 font-bold text-destructive focus:bg-destructive/10 cursor-pointer"
                                                            onClick={async () => {
                                                                const res = await fetch(`/api/billing/invoices/${inv.id}`)
                                                                const json = await res.json()
                                                                if (json.success) setCancellingInvoice(json.data)
                                                                setCancelOpen(true)
                                                            }}
                                                        >
                                                            <Ban className="size-4" /> Annuler
                                                        </DropdownMenuItem>
                                                    </>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>


            {/* Off-screen A4 Invoice container for print */}
            <div className="hidden print:block fixed inset-0 bg-white z-[9999]">
                <InvoiceA4 invoice={printingInvoice} ref={printRef} />
            </div>

            {/* Off-screen thermal receipt container */}
            <div style={{ position: 'fixed', left: '-9999px', top: 0 }}>
                <div ref={receiptRef}>
                    {viewingInvoice && (
                        <div className="receipt-container">
                            <div className="text-center mb-2">
                                <h2 className="font-bold uppercase" style={{ fontSize: '13px' }}>CLINIQUE MEDICO-DENTAIRE<br />Le SOURIRE</h2>
                                <p className="font-bold">NIF: 500253456</p>
                                <p>Forme juridique: SURL | RC: 00734372/25</p>
                                <p>Centre fiscal: DPMC</p>
                            </div>

                            <hr />

                            <table className="info-table">
                                <tbody>
                                    <tr>
                                        <td className="lbl">DATE:</td>
                                        <td className="val">{new Date(viewingInvoice.createdAt).toLocaleString('fr-FR')}</td>
                                    </tr>
                                    <tr>
                                        <td className="lbl">FACT NO:</td>
                                        <td className="val">{viewingInvoice.invoiceNumber}</td>
                                    </tr>
                                    <tr>
                                        <td className="lbl">PATIENT:</td>
                                        <td className="val uppercase">{viewingInvoice.patient.firstName} {viewingInvoice.patient.lastName}</td>
                                    </tr>
                                </tbody>
                            </table>

                            <hr />

                            <table className="receipt-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '75%', textAlign: 'left' }}>ITEM</th>
                                        <th style={{ width: '25%', textAlign: 'right' }}>PRIX</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewingInvoice.items.map((item: any) => (
                                        <tr key={item.id}>
                                            <td className="act-name">
                                                {item.medicalAct.name}
                                                <br />
                                                <span className="italic font-bold" style={{ fontSize: '9px' }}>{item.medicalAct.code}</span>
                                            </td>
                                            <td style={{ textAlign: 'right' }}>{Number(item.totalPrice).toLocaleString()}FBU</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>

                            <hr />

                            <table className="total-table">
                                <tbody>
                                    <tr>
                                        <td className="lbl">TOTAL BRUT:</td>
                                        <td className="val">{Number(viewingInvoice.totalAmount).toLocaleString()} FBU</td>
                                    </tr>
                                    {Number(viewingInvoice.insuranceAmount) > 0 && (
                                        <tr>
                                            <td className="lbl">PART ASSURANCE:</td>
                                            <td className="val">-{Number(viewingInvoice.insuranceAmount).toLocaleString()} FBU</td>
                                        </tr>
                                    )}
                                    <tr className="pay-row">
                                        <td className="lbl">À PAYER:</td>
                                        <td className="val">{Number(viewingInvoice.patientAmount).toLocaleString()} FBU</td>
                                    </tr>
                                    <tr>
                                        <td className="lbl" style={{ paddingTop: '4px' }}>STATUT:</td>
                                        <td className="val uppercase font-bold" style={{ paddingTop: '4px' }}>
                                            {viewingInvoice.status === 'paid' ? 'Payée' : 'En attente'}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>

                            <hr />

                            <p className="text-center italic font-black" style={{ fontSize: '11px', margin: '6px 0' }}>*** Merci de votre confiance ***</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Invoice Details Dialog */}
            <Dialog open={showDetails} onOpenChange={(open) => {
                setShowDetails(open)
                if (!open) {
                    setPaymentMethod('cash')
                    setPaymentReference('')
                }
            }}>
                <DialogContent className="max-w-2xl rounded-[2rem]">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-xl font-black">
                            <Receipt className="size-5 text-primary" />
                            Détails de la Facture {viewingInvoice?.invoiceNumber}
                        </DialogTitle>
                        <DialogDescription>Détail des prestations et breakdown financier</DialogDescription>
                    </DialogHeader>

                    {detailsLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-3">
                            <Loader2 className="size-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground animate-pulse font-bold uppercase tracking-widest text-[10px]">Chargement des détails...</p>
                        </div>
                    ) : viewingInvoice && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-muted/30 p-4 rounded-2xl border">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Patient</p>
                                    <p className="font-bold">{viewingInvoice.patient.firstName} {viewingInvoice.patient.lastName}</p>
                                    <p className="text-xs text-muted-foreground">{viewingInvoice.patient.phone || 'Pas de téléphone'}</p>
                                </div>
                                <div className="bg-muted/30 p-4 rounded-2xl border">
                                    <p className="text-[10px] font-black uppercase text-muted-foreground mb-2">Transaction</p>
                                    <div className="flex justify-between text-xs">
                                        <span className="text-muted-foreground">Date:</span>
                                        <span className="font-bold">{format(new Date(viewingInvoice.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                                    </div>
                                    <div className="flex justify-between text-xs mt-1">
                                        <span className="text-muted-foreground">Statut:</span>
                                        <span className="font-bold uppercase text-primary">{viewingInvoice.status === 'paid' ? 'Payée' : viewingInvoice.status === 'pending' ? 'En attente' : viewingInvoice.status === 'cancelled' ? 'Annulée' : viewingInvoice.status}</span>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <p className="text-[10px] font-black uppercase text-muted-foreground mb-3 px-1">Prestations médicales</p>
                                <div className="rounded-2xl border overflow-hidden">
                                    <Table>
                                        <TableHeader className="bg-muted/50">
                                            <TableRow className="hover:bg-transparent">
                                                <TableHead className="text-[10px] font-black uppercase">Désignation</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-center">Qté</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right">Prix Unit.</TableHead>
                                                <TableHead className="text-[10px] font-black uppercase text-right">Total</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {viewingInvoice.items.map((item: any) => (
                                                <TableRow key={item.id} className="text-xs">
                                                    <TableCell className="font-medium">{item.medicalAct.name}</TableCell>
                                                    <TableCell className="text-center font-bold">{item.quantity}</TableCell>
                                                    <TableCell className="text-right">{Number(item.unitPrice).toLocaleString()} FBU</TableCell>
                                                    <TableCell className="text-right font-black">{Number(item.totalPrice).toLocaleString()} FBU</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            <Separator />

                            <div className="flex flex-col gap-2 bg-primary/5 p-4 rounded-2xl">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="font-bold text-muted-foreground uppercase text-[10px]">TOTAL BRUT</span>
                                    <span className="font-black">{Number(viewingInvoice.totalAmount).toLocaleString()} FBU</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-amber-600">
                                    <span className="font-bold uppercase text-[10px]">PART ASSURANCE</span>
                                    <span className="font-black">-{Number(viewingInvoice.insuranceAmount).toLocaleString()} FBU</span>
                                </div>
                                <Separator className="bg-primary/10" />
                                <div className="flex justify-between items-center text-lg">
                                    <span className="font-black uppercase text-xs">À PAYER PATIENT</span>
                                    <span className="font-black text-primary">{Number(viewingInvoice.patientAmount).toLocaleString()} FBU</span>
                                </div>
                            </div>

                            {/* Print buttons */}
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    className="flex-1 gap-2"
                                    onClick={() => handlePrintA4(viewingInvoice)}
                                >
                                    <Printer className="size-4" /> Imprimer A4
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1 gap-2"
                                    onClick={() => handleThermalPrint(viewingInvoice)}
                                >
                                    <Printer className="size-4" /> Reçu Thermique
                                </Button>
                            </div>

                            {/* Payment section for pending invoices */}
                            {viewingInvoice.status === 'pending' && (
                                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-4">
                                    <h4 className="text-sm font-black uppercase text-orange-700 flex items-center gap-2">
                                        <CreditCard className="size-4" /> Enregistrer un Paiement
                                    </h4>

                                    <div className="grid grid-cols-3 gap-2">
                                        <Button
                                            variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                                            className={`h-14 flex-col gap-1 ${paymentMethod === 'cash' ? 'bg-orange-600' : ''}`}
                                            onClick={() => setPaymentMethod('cash')}
                                        >
                                            <Banknote className="size-5" />
                                            <span className="text-[9px] font-bold">CASH</span>
                                        </Button>
                                        <Button
                                            variant={paymentMethod === 'mobile_money' ? 'default' : 'outline'}
                                            className={`h-14 flex-col gap-1 ${paymentMethod === 'mobile_money' ? 'bg-orange-600' : ''}`}
                                            onClick={() => setPaymentMethod('mobile_money')}
                                        >
                                            <Smartphone className="size-5" />
                                            <span className="text-[9px] font-bold uppercase">MOB MONEY</span>
                                        </Button>
                                        <Button
                                            variant={paymentMethod === 'card' ? 'default' : 'outline'}
                                            className={`h-14 flex-col gap-1 ${paymentMethod === 'card' ? 'bg-orange-600' : ''}`}
                                            onClick={() => setPaymentMethod('card')}
                                        >
                                            <CreditCard className="size-5" />
                                            <span className="text-[9px] font-bold">CARTE</span>
                                        </Button>
                                    </div>

                                    {paymentMethod === 'mobile_money' && (
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Référence Transaction</label>
                                            <Input
                                                placeholder="Ex: PP2304..."
                                                className="h-10 text-sm font-mono"
                                                value={paymentReference}
                                                onChange={(e) => setPaymentReference(e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {openSessions.length > 0 && (
                                        <div className="space-y-1.5">
                                            <label className="text-[10px] font-black text-muted-foreground uppercase ml-1 flex items-center gap-1">
                                                <Landmark className="size-3" /> Caisse / Session
                                            </label>
                                            <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                                                <SelectTrigger className="h-9 text-xs">
                                                    <SelectValue placeholder="Sélectionner une caisse" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {openSessions.map((s: any) => (
                                                        <SelectItem key={s.id} value={s.id} className="text-xs">
                                                            {s.cashRegister?.name || 'Caisse'} — {new Date(s.openedAt).toLocaleString()}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    )}

                                    <Button
                                        className="w-full h-12 font-black bg-orange-600 hover:bg-orange-700 text-white"
                                        disabled={isPaying || (paymentMethod === 'mobile_money' && !paymentReference)}
                                        onClick={handlePayment}
                                    >
                                        {isPaying ? (
                                            <><Loader2 className="size-4 mr-2 animate-spin" /> Traitement...</>
                                        ) : (
                                            <><CheckCircle2 className="size-5 mr-2" /> Confirmer le Paiement de {Number(viewingInvoice.patientAmount).toLocaleString()} FBU</>
                                        )}
                                    </Button>
                                </div>
                            )}

                            {/* Cancel section for non-cancelled invoices */}
                            {viewingInvoice.status !== 'cancelled' && (
                                <div className="pt-2">
                                    <Button
                                        variant="outline"
                                        className="w-full gap-2 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                                        onClick={() => { setCancellingInvoice(viewingInvoice); setCancelOpen(true) }}
                                    >
                                        <Ban className="size-4" /> Annuler la Facture
                                    </Button>
                                </div>
                            )}

                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Cancellation reason dialog (top-level, outside detail dialog) */}
            <Dialog open={cancelOpen} onOpenChange={(open) => { setCancelOpen(open); if (!open) { setCancelReason(''); setCancellingInvoice(null) } }}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-lg font-black text-red-600">
                            <AlertCircle className="size-5" /> Annuler la Facture
                        </DialogTitle>
                        <DialogDescription>
                            Le paiement sera annulé (remboursement). Cette action est irréversible.
                        </DialogDescription>
                    </DialogHeader>
                    {cancellingInvoice && (
                        <div className="rounded-2xl bg-muted/50 p-4 space-y-2 border">
                            <div className="flex justify-between text-xs">
                                <span className="font-bold text-muted-foreground uppercase">Facture</span>
                                <span className="font-black">{cancellingInvoice.invoiceNumber}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="font-bold text-muted-foreground uppercase">Patient</span>
                                <span className="font-semibold">{cancellingInvoice.patient?.firstName} {cancellingInvoice.patient?.lastName}</span>
                            </div>

                            {cancellingInvoice.items && cancellingInvoice.items.length > 0 && (
                                <div className="pt-1">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase mb-1">Prestations</p>
                                    {cancellingInvoice.items.map((item: any, i: number) => (
                                        <div key={item.id || i} className="flex justify-between text-[11px] py-0.5">
                                            <span className="text-muted-foreground">{item.medicalAct?.name || item.medicalAct?.code || "—"}</span>
                                            <span className="font-semibold">{Number(item.totalPrice).toLocaleString()} FBU</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            <hr className="border-muted-foreground/20" />
                            <div className="flex justify-between text-xs">
                                <span className="font-bold text-muted-foreground uppercase">Montant</span>
                                <span className="font-black">{Number(cancellingInvoice.patientAmount).toLocaleString()} FBU</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="font-bold text-muted-foreground uppercase">Statut</span>
                                <span className="font-semibold capitalize">{cancellingInvoice.status === 'paid' ? 'Payée' : cancellingInvoice.status === 'pending' ? 'En attente' : cancellingInvoice.status}</span>
                            </div>
                        </div>
                    )}
                    <div className="space-y-2">
                        <Label>Motif d'annulation</Label>
                        <textarea
                            className="w-full min-h-[100px] p-3 rounded-xl border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-500/20"
                            placeholder="Expliquez la raison de l'annulation..."
                            value={cancelReason}
                            onChange={(e) => setCancelReason(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                                        <Button variant="outline" onClick={() => { setCancelOpen(false); setCancelReason(''); setCancellingInvoice(null) }}>Retour</Button>
                        <Button
                            className="bg-red-600 hover:bg-red-700 text-white"
                            disabled={isCancelling || !cancelReason.trim()}
                            onClick={handleCancel}
                        >
                            {isCancelling ? <><Loader2 className="size-4 mr-2 animate-spin" /> Annulation...</> : 'Confirmer l\'annulation'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
