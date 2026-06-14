"use client"

import React, { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import {
    ArrowLeft,
    Printer,
    CheckCircle2,
    Clock,
    Shield,
    FileText,
    Users,
    ChevronRight
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import { BordereauA4 } from "@/components/insurances/bordereau-a4"

interface Batch {
    id: string
    batchNumber: string
    status: string
    totalAmount: string
    createdAt: string
    insurance: { name: string }
    insuranceId: string
    claims: Array<{
        id: string
        claimAmount: string
        patient: {
            firstName: string
            lastName: string
            patientNumber: string
            insurances: any[]
        }
        invoice: {
            invoiceNumber: string
            insuranceAmount: string
            patientAmount: string
            patient: {
                firstName: string
                lastName: string
                patientNumber: string
                insurances: any[]
            }
            items: Array<{
                id: string
                medicalAct: { name: string }
                quantity: number
                totalPrice: string
            }>
        }
    }>
}

export default function BatchDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [batch, setBatch] = useState<Batch | null>(null)
    const [loading, setLoading] = useState(true)
    const [settling, setSettling] = useState(false)
    const [isSettleOpen, setIsSettleOpen] = useState(false)
    const [paymentDetails, setPaymentDetails] = useState({
        method: 'transfer',
        reference: ''
    })
    const printRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        fetchBatch()
    }, [params.id])

    async function fetchBatch() {
        try {
            const res = await fetch(`/api/insurances/claims/batches/${params.id}`)
            const data = await res.json()
            if (res.ok) {
                setBatch(data.data)
            } else {
                toast.error("Bordereau non trouvé")
                router.push("/insurances/claims")
            }
        } catch (err) {
            toast.error("Erreur de chargement")
        } finally {
            setLoading(false)
        }
    }

    async function handleSettleBatch() {
        if (!batch) return

        // Validate reference for bank/check
        if (['transfer', 'check'].includes(paymentDetails.method) && !paymentDetails.reference) {
            toast.error("Une référence est obligatoire pour les virements et chèques")
            return
        }

        setSettling(true)
        try {
            const res = await fetch(`/api/insurances/claims/batches/${batch.id}/settle`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    amount: batch.totalAmount,
                    paymentMethod: paymentDetails.method,
                    referenceNumber: paymentDetails.reference || "SETTLE-" + Date.now().toString().slice(-6)
                })
            })
            if (res.ok) {
                toast.success("Bordereau soldé avec succès")
                setIsSettleOpen(false)
                fetchBatch()
            }
        } catch (err) {
            toast.error("Erreur de règlement")
        } finally {
            setSettling(false)
        }
    }

    const handlePrint = () => {
        window.print()
    }

    if (loading) {
        return (
            <div className="p-20 text-center space-y-4">
                <div className="animate-spin size-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
                <p className="text-muted-foreground font-bold tracking-widest uppercase text-xs">Chargement du Bordereau...</p>
            </div>
        )
    }

    if (!batch) return null

    return (
        <div className="relative min-h-screen bg-muted/5">
            {/* Main Page Content - Hidden during print */}
            <div className="p-6 space-y-6 max-w-[1200px] mx-auto print:hidden">
                <div className="flex items-center gap-4 mb-2">
                    <Button variant="ghost" size="sm" className="rounded-full gap-2 font-bold text-muted-foreground hover:bg-white" onClick={() => router.push("/insurances/claims")}>
                        <ArrowLeft className="size-4" /> Retour
                    </Button>
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground uppercase tracking-widest">
                        <span>Insurances</span>
                        <ChevronRight className="size-3" />
                        <span>Bordereaux</span>
                        <ChevronRight className="size-3 text-primary" />
                        <span className="text-primary">{batch.batchNumber}</span>
                    </div>
                </div>

                <PageHeader
                    title={`Bordereau ${batch.batchNumber}`}
                    description={`${batch.insurance.name} • Créé le ${new Date(batch.createdAt).toLocaleDateString('fr-FR')}`}
                >
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="rounded-full font-black uppercase text-[10px] tracking-widest border-muted/50 bg-white" onClick={handlePrint}>
                            <Printer className="size-4 mr-2" /> Imprimer
                        </Button>
                        {batch.status === 'pending' && (
                            <Button
                                className="rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20 bg-primary hover:bg-primary/90"
                                onClick={() => {
                                    console.log("Opening settle dialog...")
                                    setIsSettleOpen(true)
                                }}
                                disabled={settling}
                            >
                                <CheckCircle2 className="size-4 mr-2" />
                                Solder ce Bordereau
                            </Button>
                        )}
                    </div>
                </PageHeader>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
                    <div className="lg:col-span-3 space-y-6">
                        <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
                            <CardHeader className="pb-4">
                                <CardTitle className="text-xl font-black flex items-center gap-2">
                                    Récapitulatif des Prestations
                                </CardTitle>
                                <CardDescription className="font-bold text-primary text-[10px] uppercase tracking-widest">
                                    Listing auditable des hospitalisations et actes médicaux
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                <Table>
                                    <TableHeader className="bg-primary/5">
                                        <TableRow className="border-muted/50 hover:bg-transparent">
                                            <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-muted-foreground w-8 text-center italic">No</TableHead>
                                            <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Patient & Détails</TableHead>
                                            <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground text-center w-20">Facture</TableHead>
                                            <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground text-center w-16">Taux (%)</TableHead>
                                            <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground text-right w-24 italic">Part Patient</TableHead>
                                            <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground text-right pr-8 w-24">Part Ass.</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {batch.claims.map((claim, idx) => {
                                            const patientData = claim.invoice?.patient || claim.patient;
                                            const pInsurance = patientData?.insurances?.find(pi => pi.insuranceId === batch.insuranceId);

                                            const coverageVal = pInsurance?.coverageRate ? parseFloat(pInsurance.coverageRate) : 100;
                                            const coverageRate = `${coverageVal}%`;

                                            return (
                                                <React.Fragment key={claim.id}>
                                                    <TableRow className="border-muted/50 hover:bg-primary/5 group transition-colors">
                                                        <TableCell className="py-5 pl-8 text-[10px] font-black text-muted-foreground text-center italic">{idx + 1}</TableCell>
                                                        <TableCell className="py-5">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center gap-2">
                                                                    <p className="font-black text-sm text-foreground uppercase tracking-tight">
                                                                        {patientData.firstName} {patientData.lastName}
                                                                    </p>
                                                                    <Badge variant="outline" className="text-[9px] font-black bg-muted/40 border-none px-1.5 py-0">#{patientData.patientNumber}</Badge>
                                                                </div>
                                                                {pInsurance && (
                                                                    <div className="flex flex-col gap-0.5 border-l-2 border-primary/20 pl-2">
                                                                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
                                                                            Police: <span className="text-foreground">{pInsurance.insuranceNumber || 'N/A'}</span>
                                                                            <span className="mx-2 opacity-30 text-primary">|</span>
                                                                            Carte: <span className="text-foreground">{pInsurance.insuranceCardNumber || 'N/A'}</span>
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center font-mono text-[10px] font-bold text-muted-foreground">
                                                            {claim.invoice?.invoiceNumber}
                                                        </TableCell>
                                                        <TableCell className="text-center font-black text-[10px] text-foreground">
                                                            {coverageRate}
                                                        </TableCell>
                                                        <TableCell className="text-right font-bold text-xs text-muted-foreground italic">
                                                            {parseInt(claim.invoice?.patientAmount || '0').toLocaleString()}
                                                        </TableCell>
                                                        <TableCell className="text-right pr-8 font-black text-sm text-primary">
                                                            {parseInt(claim.invoice?.insuranceAmount || claim.claimAmount || '0').toLocaleString()}
                                                        </TableCell>
                                                    </TableRow>

                                                    {/* Nested Act Details */}
                                                    {claim.invoice?.items?.map((item) => {
                                                        const itemTotalPrice = parseInt(item.totalPrice || '0');
                                                        const itemInsuranceAmount = (itemTotalPrice * coverageVal) / 100;
                                                        const itemPatientAmount = itemTotalPrice - itemInsuranceAmount;

                                                        return (
                                                            <TableRow key={item.id} className="border-none hover:bg-transparent h-0">
                                                                <TableCell colSpan={6} className="p-0">
                                                                    <div className="flex items-center gap-4 py-2 pl-16 pr-8 text-[10px] bg-muted/10 opacity-70 italic font-medium text-muted-foreground border-b border-muted/20">
                                                                        <span className="shrink-0 text-primary/40">• {item.medicalAct?.name || 'Prestation'}</span>
                                                                        <span className="text-[8px] NOT-italic opacity-40">({item.quantity}x)</span>
                                                                        <div className="flex-grow border-t border-dashed border-muted/30" />
                                                                        <span className="shrink-0 opacity-50 px-2">{coverageVal}%</span>
                                                                        <span className="shrink-0 w-24 text-right opacity-30">{itemPatientAmount.toLocaleString()}</span>
                                                                        <span className="shrink-0 w-24 text-right font-black opacity-60 text-primary/70">{itemInsuranceAmount.toLocaleString()}</span>
                                                                    </div>
                                                                </TableCell>
                                                            </TableRow>
                                                        )
                                                    })}
                                                </React.Fragment>
                                            )
                                        })}
                                    </TableBody>
                                </Table>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="space-y-6">
                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden font-sans border-t-8 border-white/20">
                            <CardContent className="p-8 space-y-6 relative">
                                <div className="absolute -top-10 -right-10 size-40 bg-white/10 rounded-full blur-3xl animate-pulse" />
                                <div className="flex items-center justify-between">
                                    <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                        <FileText className="size-6 text-white" />
                                    </div>
                                    <Badge className={cn("rounded-full px-3 py-1 border-none text-[10px] font-black uppercase shadow-lg", batch.status === 'paid' ? "bg-green-500 text-white" : "bg-orange-500 text-white")}>
                                        {batch.status === 'paid' ? 'Soldé' : 'En Attente'}
                                    </Badge>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Montant Global Réclamé</p>
                                    <h2 className="text-4xl font-black tracking-tight leading-none">
                                        {parseInt(batch.totalAmount).toLocaleString()}
                                        <span className="text-xs ml-2 opacity-80 uppercase tracking-tighter italic">FBU</span>
                                    </h2>
                                </div>
                                <div className="space-y-3 pt-4 border-t border-white/10">
                                    <div className="flex justify-between text-[10px] font-medium opacity-80">
                                        <span>Factures Incluses</span>
                                        <span className="font-black">{batch.claims.length} dossiers</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-medium opacity-80">
                                        <span>Partenaire</span>
                                        <span className="font-black text-right">{batch.insurance.name}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="rounded-[2.5rem] border-none shadow-sm bg-card/60 backdrop-blur-xl font-sans">
                            <CardHeader>
                                <CardTitle className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Users className="size-3" />
                                    Audit Log
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex gap-4">
                                    <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px] shrink-0 italic">!</div>
                                    <p className="text-xs text-muted-foreground leading-relaxed font-medium italic">
                                        Ce bordereau regroupe des transactions validées cliniquement. Toute modification après règlement est verrouillée.
                                    </p>
                                </div>
                                <div className="pt-4 border-t border-muted/30">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Source Système</p>
                                    <p className="text-[10px] font-black text-foreground mt-1">MEDICARE HIS - MODULE ASSURANCE V2</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>


            {/* Settle Modal */}
            <Dialog open={isSettleOpen} onOpenChange={setIsSettleOpen}>
                <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-card/95 backdrop-blur-2xl">
                    <DialogHeader className="p-8 bg-primary text-primary-foreground">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight">Règlement du Bordereau</DialogTitle>
                        <DialogDescription className="text-primary-foreground/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                            Confirmation de l'encaissement des fonds
                        </DialogDescription>
                    </DialogHeader>

                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mode de Paiement</Label>
                                <Select
                                    value={paymentDetails.method}
                                    onValueChange={(v) => setPaymentDetails(prev => ({ ...prev, method: v }))}
                                >
                                    <SelectTrigger className="h-12 rounded-2xl border-muted bg-muted/20 font-bold focus:ring-primary">
                                        <SelectValue placeholder="Choisir un mode" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-none shadow-2xl">
                                        <SelectItem value="transfer" className="rounded-xl font-bold">Virement Bancaire</SelectItem>
                                        <SelectItem value="check" className="rounded-xl font-bold">Chèque</SelectItem>
                                        <SelectItem value="cash" className="rounded-xl font-bold">Espèces</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {['transfer', 'check'].includes(paymentDetails.method) && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Référence du Paiement</Label>
                                    <Input
                                        placeholder={paymentDetails.method === 'transfer' ? "Ex: VIR-2024-001" : "Ex: CHQ-550123"}
                                        className="h-12 rounded-2xl border-muted bg-muted/20 font-bold focus-visible:ring-primary"
                                        value={paymentDetails.reference}
                                        onChange={(e) => setPaymentDetails(prev => ({ ...prev, reference: e.target.value }))}
                                    />
                                </div>
                            )}
                        </div>

                        <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">Montant à Encaisser</p>
                            <p className="text-2xl font-black text-primary">
                                {parseInt(batch.totalAmount).toLocaleString()} <span className="text-xs font-normal">FBU</span>
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="p-6 bg-muted/30 border-t border-muted/50 gap-3">
                        <Button variant="ghost" className="rounded-full font-black uppercase text-[10px] tracking-widest" onClick={() => setIsSettleOpen(false)}>
                            Annuler
                        </Button>
                        <Button
                            className="rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
                            onClick={handleSettleBatch}
                            disabled={settling}
                        >
                            {settling ? "Traitement..." : "Confirmer le Règlement"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Off-screen A4 container for printing */}
            <div className="hidden print:block bg-white relative">
                <BordereauA4 batch={batch} ref={printRef} />
            </div>
        </div>
    )
}
