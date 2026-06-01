"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useCurrentUser } from "@/hooks/use-current-user"
import { Printer, Plus, ArrowLeft } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface SaleDetail {
    id: string
    saleDate: string
    customerName: string | null
    totalAmount: string
    subtotal: string
    paymentMethod: string
    items: Array<{
        id: string
        quantity: string
        unitPrice: string
        totalPrice: string
        medicine: { name: string, genericName: string | null }
        lot: { lotNumber: string }
    }>
}

export default function SaleReceiptPage() {
    const router = useRouter()
    const params = useParams()
    const { user } = useCurrentUser()
    const [sale, setSale] = useState<SaleDetail | null>(null)
    const [loading, setLoading] = useState(true)
    const [isThermal, setIsThermal] = useState(false)

    useEffect(() => {
        async function fetchSale() {
            try {
                const res = await fetch(`/api/pharmacy/sales/${params?.id}`)
                const data = await res.json()
                if (res.ok) setSale(data.data)
            } catch (err) {
                console.error("Failed to fetch sale details")
            } finally {
                setLoading(false)
            }
        }
        if (params?.id) fetchSale()
    }, [params?.id])

    if (loading) return <div className="p-6 text-center animate-pulse py-12 text-foreground font-black uppercase tracking-widest">Chargement du reçu...</div>
    if (!sale) return <div className="p-6 text-center text-destructive py-12 font-black uppercase tracking-widest">Reçu non trouvé</div>

    return (
        <div className="p-6 max-w-2xl mx-auto space-y-6 text-foreground">
            <div className="flex items-center justify-between print:hidden">
                <Button variant="ghost" onClick={() => router.push("/pharmacy/sales")} className="gap-2 hover:bg-muted font-bold text-muted-foreground hover:text-foreground">
                    <ArrowLeft className="size-4" /> Retour
                </Button>
                <div className="flex items-center gap-3">
                    <div className="flex bg-muted rounded-xl p-1 border border-border">
                        <Button
                            variant={!isThermal ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setIsThermal(false)}
                            className="text-[10px] font-black uppercase px-4 h-8 rounded-lg"
                        >
                            Standard (A4)
                        </Button>
                        <Button
                            variant={isThermal ? "secondary" : "ghost"}
                            size="sm"
                            onClick={() => setIsThermal(true)}
                            className="text-[10px] font-black uppercase px-4 h-8 rounded-lg"
                        >
                            Thermique (80mm)
                        </Button>
                    </div>
                    <div className="w-px h-6 bg-border mx-1" />
                    <Button variant="outline" onClick={() => window.print()} className="gap-2 border-border shadow-sm font-black text-[10px] uppercase tracking-widest px-6">
                        <Printer className="size-4" /> Imprimer
                    </Button>
                    <Button onClick={() => router.push("/pharmacy/sales/new")} className="gap-2 bg-primary text-primary-foreground shadow-lg shadow-primary/20 font-black text-[10px] uppercase tracking-widest px-6">
                        <Plus className="size-4" /> Nouvelle Vente
                    </Button>
                </div>
            </div>

            {/* Standard A4 Layout */}
            {!isThermal && (
                <div className="block print:block">
                    <Card className="border border-border shadow-lg print:border-none print:shadow-none bg-card overflow-hidden rounded-2xl">
                        <CardContent className="p-8 space-y-6 shadow-sm">
                            <div className="text-center space-y-2">
                                <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground">MEDICARE HOSPITAL</h1>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">Service Pharmacie - Reçu Officiel</p>
                                <div className="pt-4 flex justify-center items-center gap-2">
                                    <div className="size-2 rounded-full bg-emerald-500 animate-pulse print:hidden" />
                                    <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm tracking-widest">TRANSACTION RÉUSSIE</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="h-px flex-1 bg-muted" />
                                <div className="size-1 rounded-full bg-muted-foreground/30" />
                                <div className="h-px flex-1 bg-muted" />
                            </div>

                            <div className="grid grid-cols-2 gap-x-8 gap-y-4 text-sm">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Client / Patient</p>
                                    <p className="font-bold text-foreground border-l-2 border-primary pl-2">{sale.customerName || "Anonyme"}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Référence Reçu</p>
                                    <p className="font-mono text-xs font-bold text-foreground bg-muted px-2 py-0.5 rounded-md inline-block">
                                        #{sale.id.slice(0, 8).toUpperCase()}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Date de Vente</p>
                                    <p className="font-bold text-foreground/80">{format(new Date(sale.saleDate), "dd MMM yyyy 'à' HH:mm", { locale: fr })}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-wider">Mode de Paiement</p>
                                    <p className="font-bold uppercase text-foreground/80">{sale.paymentMethod === 'cash' ? 'Espèces / Cash' : sale.paymentMethod}</p>
                                </div>
                            </div>

                            <div className="overflow-hidden rounded-xl border border-border">
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-muted/50 border-b border-border">
                                            <th className="px-4 py-3 text-left font-black uppercase text-[10px] text-muted-foreground tracking-wider">Article / Lot</th>
                                            <th className="px-4 py-3 text-center font-black uppercase text-[10px] text-muted-foreground tracking-wider">Quantité</th>
                                            <th className="px-4 py-3 text-right font-black uppercase text-[10px] text-muted-foreground tracking-wider">Prix Unitaire</th>
                                            <th className="px-4 py-3 text-right font-black uppercase text-[10px] text-muted-foreground tracking-wider">Sous-total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border">
                                        {sale.items.map((item) => (
                                            <tr key={item.id} className="hover:bg-muted/20 transition-colors">
                                                <td className="px-4 py-4">
                                                    <div className="flex flex-col gap-0.5">
                                                        <span className="font-bold text-foreground leading-tight">{item.medicine.name}</span>
                                                        <span className="text-[9px] text-muted-foreground uppercase font-black tracking-widest italic">{item.medicine.genericName || "Standard DCI"}</span>
                                                        <span className="text-[10px] text-muted-foreground font-mono font-medium pt-1 opacity-50">Lot: {item.lot.lotNumber}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-4 text-center">
                                                    <span className="inline-flex items-center justify-center size-7 bg-muted rounded-full font-bold text-xs text-foreground/80">
                                                        {parseFloat(item.quantity)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 text-right text-muted-foreground font-medium">{parseFloat(item.unitPrice).toLocaleString()} FBu</td>
                                                <td className="px-4 py-4 text-right font-bold text-foreground">{parseFloat(item.totalPrice).toLocaleString()} FBu</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex justify-between items-center text-sm px-4">
                                    <span className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Sous-total Brut</span>
                                    <span className="font-bold text-muted-foreground">{parseFloat(sale.subtotal).toLocaleString()} FBu</span>
                                </div>
                                <div className="flex justify-between items-center bg-sidebar text-sidebar-foreground p-5 rounded-2xl shadow-inner">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-sidebar-foreground/50 uppercase tracking-[0.2em] mb-1">Total Net à Payer</span>
                                        <span className="text-xs text-sidebar-foreground/30 italic lowercase font-medium">Toutes taxes comprises</span>
                                    </div>
                                    <span className="text-3xl font-black tracking-tighter">{parseFloat(sale.totalAmount).toLocaleString()} <span className="text-sm font-normal opacity-50 ml-1">FBu</span></span>
                                </div>
                            </div>

                            <div className="pt-10 text-center space-y-6">
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-12 h-0.5 bg-foreground" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-foreground">Signature Pharmacie</span>
                                </div>
                                <p className="text-[10px] text-muted-foreground max-w-[280px] mx-auto leading-relaxed italic font-medium">
                                    Ce document tient lieu de facture acquittée. Les produits pharmaceutiques ne sont ni repris ni échangés après livraison.
                                </p>
                                <div className="text-[8px] font-mono text-muted-foreground/30 select-none">
                                    {sale.id}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Thermal Receipt Version */}
            {isThermal && <ThermalReceipt sale={sale} cashier={user?.fullName || user?.username || 'Système'} />}

            <style jsx global>{`
        @media print {
          .max-w-2xl { max-width: ${isThermal ? '80mm' : '100%'} !important; margin: 0 auto !important; }
          @page { 
            margin: 0; 
            size: ${isThermal ? '80mm auto' : 'auto'};
          }
          /* Specific overrides for thermal font consistency */
          .thermal-only { display: ${isThermal ? 'block' : 'none'} !important; }
          .standard-only { display: ${isThermal ? 'none' : 'block'} !important; }
        }
      `}</style>
        </div>
    )
}

function ThermalReceipt({ sale, cashier }: { sale: SaleDetail, cashier: string }) {
    return (
        <div className={cn(
            "font-mono text-black bg-white p-4 max-w-[80mm] mx-auto border-x border-dashed border-gray-200 shadow-xl print:shadow-none print:border-none",
            "block print:block thermal-only"
        )}>
            <div className="text-center mb-4">
                <h1 className="text-base font-black uppercase">CLINIQUE MEDICO-DENTAIRE<br />Le SOURIRE</h1>
                <p className="text-[10px] font-bold mt-1">NIF: 500253456</p>
                <div className="border-t border-black border-dashed my-2" />
                <p className="text-[10px] font-bold">REÇU DE PHARMACIE</p>
                <p className="text-[8px]">#{sale.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="text-[10px] space-y-1 mb-4">
                <div className="flex justify-between italic text-[11px]">
                    <span>CAISSIER:</span>
                    <span className="uppercase">{cashier}</span>
                </div>
                <div className="flex justify-between">
                    <span>Date:</span>
                    <span>{format(new Date(sale.saleDate), 'dd/MM/yy HH:mm')}</span>
                </div>
                <div className="flex justify-between">
                    <span>Client:</span>
                    <span className="font-bold">{sale.customerName || "CAS Comptant"}</span>
                </div>
            </div>

            <div className="border-t border-black border-dashed my-2" />

            <table className="w-full text-[10px]">
                <thead className="text-left border-b border-black border-dashed">
                    <tr>
                        <th className="py-1">ARTICLE</th>
                        <th className="py-1 text-center">QTÉ</th>
                        <th className="py-1 text-right">TOTAL</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 divide-dashed">
                    {sale.items.map((item) => (
                        <tr key={item.id}>
                            <td className="py-2 pr-2">
                                <div className="flex flex-col">
                                    <span className="font-bold uppercase leading-tight">{item.medicine.name}</span>
                                    <span className="text-[8px] italic">{item.medicine.genericName || "Unspecified"}</span>
                                    <span className="text-[7px] text-gray-500">Lot: {item.lot.lotNumber}</span>
                                </div>
                            </td>
                            <td className="py-2 text-center align-top">{parseFloat(item.quantity)}</td>
                            <td className="py-2 text-right align-top">{parseFloat(item.totalPrice).toLocaleString()}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <div className="border-t-2 border-black border-double my-2" />

            <div className="space-y-1 py-2">
                <div className="flex justify-between text-xs font-bold">
                    <span>TOTAL BRUT:</span>
                    <span>{parseFloat(sale.subtotal).toLocaleString()} FBu</span>
                </div>
                <div className="flex justify-between text-base font-black pt-2 border-t border-black border-dashed mt-2">
                    <span>NET À PAYER:</span>
                    <span>{parseFloat(sale.totalAmount).toLocaleString()} FBu</span>
                </div>
                <div className="text-center text-[9px] pt-4 italic font-bold">
                    Paiement: {sale.paymentMethod.toUpperCase()}
                </div>
            </div>

            <div className="border-t border-black border-dashed my-4" />

            <div className="text-center space-y-2 pb-8">
                <p className="text-[9px] font-bold">MERCI DE VOTRE CONFIANCE</p>
                <p className="text-[7px] leading-tight">Les médicaments ne sont pas repris<br />ni échangés</p>
                <div className="pt-4 opacity-10">***</div>
            </div>
        </div >
    )
}
