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
    Eye,
    ListFilter,
    Loader2
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
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { InvoiceA4 } from "@/components/billing/invoice-a4"
import { toast } from "sonner"

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
    const printRef = useRef<HTMLDivElement>(null)
    const receiptRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        async function fetchInvoices() {
            try {
                const res = await fetch('/api/billing/invoices/list')
                const data = await res.json()
                if (data.success) {
                    setInvoices(data.data)
                }
            } catch (error) {
                console.error('Failed to fetch invoices:', error)
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
                        * { box-sizing: border-box; margin: 0; padding: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        body {
                            font-family: 'Courier New', Courier, monospace;
                            font-size: 15px;
                            font-weight: 700;
                            background: #fff;
                            width: 100mm;
                            padding: 4mm;
                            margin: 0 auto;
                            line-height: 1.2;
                        }
                        .flex { display: flex; }
                        .flex-col { display: flex; flex-direction: column; }
                        .items-center { align-items: center; }
                        .justify-between { justify-content: space-between; }
                        .w-full { width: 100%; }
                        .text-center { text-align: center; }
                        .text-right { text-align: right; }
                        .font-bold { font-weight: bold; }
                        .font-black { font-weight: 900; }
                        .uppercase { text-transform: uppercase; }
                        .italic { font-style: italic; }
                        .my-2 { margin-top: 10px; margin-bottom: 10px; }
                        .mb-2 { margin-bottom: 10px; }
                        .border-t { border-top: 1.5px solid #000; }
                        .border-b { border-bottom: 1.5px solid #000; }
                        .border-dashed { border-style: dashed; border-top-width: 1.5px; }
                        .table { display: table; width: 100%; }
                        .table-row { display: table-row; }
                        .table-cell { display: table-cell; padding-top: 6px; padding-bottom: 6px; }
                        @media print {
                            body { width: 100mm; margin: 0; padding: 4mm; }
                            @page { size: 100mm auto; margin: 0; }
                        }
                    </style>
                </head>
                <body onload="setTimeout(() => { window.print(); window.close(); }, 500)">
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
                                                <DropdownMenuSeparator />
                                                {/* <DropdownMenuItem className="rounded-xl gap-2 font-bold text-destructive focus:bg-destructive/10 cursor-pointer">
                                                    Annuler
                                                </DropdownMenuItem> */}
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
                        <div className="flex-col items-center w-full">
                            <div className="text-center mb-2">
                                <h2 className="font-bold uppercase" style={{ fontSize: '15px' }}>CLINIQUE MEDICO-DENTAIRE<br />Le SOURIRE</h2>
                                <p className="font-bold text-[11px] mt-1">NIF: 500253456</p>
                                <p className="text-[9px] mt-1">Forme juridique: SURL | RC: 00734372/25</p>
                                <p className="text-[9px]">Centre fiscal: DPMC</p>
                            </div>
                            <div className="w-full border-t border-dashed my-2" />

                            <div className="w-full flex-col">
                                <div className="flex justify-between">
                                    <span>DATE:</span>
                                    <span>{new Date(viewingInvoice.createdAt).toLocaleString('fr-FR')}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>FACT NO:</span>
                                    <span>{viewingInvoice.invoiceNumber}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>PATIENT:</span>
                                    <span className="uppercase text-right">{viewingInvoice.patient.firstName} {viewingInvoice.patient.lastName}</span>
                                </div>
                            </div>

                            <div className="w-full border-t border-dashed my-2" />

                            <div className="table">
                                <div className="table-row border-b font-bold">
                                    <div className="table-cell">ITEM</div>
                                    <div className="table-cell text-right">PRIX</div>
                                </div>
                                {viewingInvoice.items.map((item: any) => (
                                    <div key={item.id} className="table-row">
                                        <div className="table-cell py-1">
                                            {item.medicalAct.name}
                                            <br />
                                            <span className="italic font-bold" style={{ fontSize: '14px' }}>{item.medicalAct.code}</span>
                                        </div>
                                        <div className="table-cell text-right">{Number(item.totalPrice).toLocaleString()}FBU</div>
                                    </div>
                                ))}
                            </div>

                            <div className="w-full border-t border-dashed my-2" />

                            <div className="w-full flex-col">
                                <div className="flex justify-between font-bold">
                                    <span>TOTAL BRUT:</span>
                                    <span>{Number(viewingInvoice.totalAmount).toLocaleString()} FBU</span>
                                </div>
                                {Number(viewingInvoice.insuranceAmount) > 0 && (
                                    <div className="flex justify-between">
                                        <span>PART ASSURANCE:</span>
                                        <span>-{Number(viewingInvoice.insuranceAmount).toLocaleString()} FBU</span>
                                    </div>
                                )}
                                <div className="flex justify-between font-black" style={{ fontSize: '22px' }}>
                                    <span>À PAYER:</span>
                                    <span>{Number(viewingInvoice.patientAmount).toLocaleString()} FBU</span>
                                </div>
                                <div className="w-full border-t my-1" />
                                <div className="flex justify-between">
                                    <span>STATUT:</span>
                                    <span className="uppercase font-bold">{viewingInvoice.status === 'paid' ? 'Payée' : 'En attente'}</span>
                                </div>
                            </div>

                            <div className="w-full border-t border-dashed my-4" />
                            <p className="text-center italic font-black" style={{ fontSize: '16px' }}>*** Merci de votre confiance ***</p>
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
                                        <span className="font-bold uppercase text-primary">{viewingInvoice.status === 'paid' ? 'Payée' : viewingInvoice.status === 'pending' ? 'En attente' : viewingInvoice.status}</span>
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
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}
