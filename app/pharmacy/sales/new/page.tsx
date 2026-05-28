"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, Trash2, ShoppingCart, User, Package, Calendar, CheckCircle2, ChevronRight } from "lucide-react"
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
    TableRow,
} from "@/components/ui/table"
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

interface Lot {
    id: string
    lotNumber: string
    quantityRemaining: string
    expiryDate: string
}

interface Medicine {
    id: string
    name: string
    genericName: string | null
    sellingPrice: string
    unit: string
    totalAvailable: string
    lots: Lot[]
}

interface CartItem {
    medicine: Medicine
    quantity: number
    fefoBreakdown: Array<{ lotNumber: string; qty: number }>
}

export default function NewSalePage() {
    const router = useRouter()
    const [medicines, setMedicines] = useState<Medicine[]>([])
    const [search, setSearch] = useState("")
    const [cart, setCart] = useState<CartItem[]>([])
    const [customerName, setCustomerName] = useState("")
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        async function fetchMedicines() {
            try {
                const res = await fetch("/api/pharmacy/sales/available-medicines")
                const data = await res.json()
                if (res.ok) setMedicines(data.data)
            } catch (err) {
                toast.error("Échec du chargement des médicaments")
            }
        }
        fetchMedicines()
    }, [])

    const filteredMedicines = medicines.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.genericName?.toLowerCase().includes(search.toLowerCase())
    )

    const addToCart = (medicine: Medicine, requestedQty: number) => {
        if (requestedQty <= 0) return

        const totalAvail = parseFloat(medicine.totalAvailable)
        if (requestedQty > totalAvail) {
            toast.error(`Stock insuffisant pour ${medicine.name}`)
            return
        }

        let remaining = requestedQty
        const breakdown: Array<{ lotNumber: string; qty: number }> = []

        for (const lot of medicine.lots) {
            if (remaining <= 0) break
            const avail = parseFloat(lot.quantityRemaining)
            const take = Math.min(avail, remaining)
            breakdown.push({ lotNumber: lot.lotNumber, qty: take })
            remaining -= take
        }

        setCart(prev => {
            const existingIdx = prev.findIndex(item => item.medicine.id === medicine.id)
            if (existingIdx > -1) {
                const newCart = [...prev]
                newCart[existingIdx] = { medicine, quantity: requestedQty, fefoBreakdown: breakdown }
                return newCart
            }
            return [...prev, { medicine, quantity: requestedQty, fefoBreakdown: breakdown }]
        })
        toast.success(`${medicine.name} ajouté au panier`)
    }

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(item => item.medicine.id !== id))
    }

    const totalAmount = useMemo(() => {
        return cart.reduce((sum, item) => sum + (parseFloat(item.medicine.sellingPrice) * item.quantity), 0)
    }, [cart])

    const confirmSale = async () => {
        if (cart.length === 0) return
        setLoading(true)
        try {
            const res = await fetch("/api/pharmacy/sales", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    customerName: customerName || null,
                    items: cart.map(item => ({
                        medicineId: item.medicine.id,
                        quantity: item.quantity
                    }))
                })
            })

            const data = await res.json()
            if (res.ok) {
                toast.success("Vente confirmée !")
                router.push(`/pharmacy/sales/${data.data.id}`)
            } else {
                toast.error(data.error || "Une erreur est survenue")
            }
        } catch (err) {
            toast.error("Erreur réseau")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="p-6 space-y-6  mx-auto min-h-screen text-foreground">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title="Vente Pharmacie Directe"
                    description="Saisie rapide des ventes et déstockage FEFO automatique"
                />
                <Button variant="outline" onClick={() => router.push("/pharmacy/sales")} className="w-fit border-border hover:bg-muted">
                    Voir l'historique
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-7 space-y-6">
                    <Card className="border-border shadow-xl rounded-3xl overflow-hidden border-t-8 border-t-primary bg-card/50 backdrop-blur-sm">
                        <CardHeader className="bg-muted/30 border-b px-8 py-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-primary/10 rounded-2xl">
                                        <ShoppingCart className="size-6 text-primary" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-2xl font-black tracking-tight">Panier de Vente</CardTitle>
                                        <CardDescription className="font-medium text-muted-foreground">{cart.length} médicament(s) sélectionnés</CardDescription>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setCart([])}
                                    disabled={cart.length === 0}
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10 font-bold uppercase tracking-widest text-[10px]"
                                >
                                    Vider
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="hover:bg-transparent border-none">
                                        <TableHead className="pl-8 font-black uppercase text-[10px] text-muted-foreground tracking-wider h-12">Article / Lots FEFO</TableHead>
                                        <TableHead className="text-center font-black uppercase text-[10px] text-muted-foreground tracking-wider h-12">Qty</TableHead>
                                        <TableHead className="text-right font-black uppercase text-[10px] text-muted-foreground tracking-wider h-12">Prix</TableHead>
                                        <TableHead className="text-right font-black uppercase text-[10px] text-muted-foreground tracking-wider h-12">Total</TableHead>
                                        <TableHead className="w-16"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {cart.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-80 text-center">
                                                <div className="flex flex-col items-center gap-4 text-muted-foreground">
                                                    <div className="p-6 bg-muted rounded-full border border-border">
                                                        <Plus className="size-10 opacity-10" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-bold">Le panier est encore vide</p>
                                                        <p className="text-xs">Choisissez des médicaments dans le catalogue à droite</p>
                                                    </div>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : (
                                        cart.map((item) => (
                                            <TableRow key={item.medicine.id} className="group hover:bg-muted/50 transition-colors border-border">
                                                <TableCell className="pl-8 py-6">
                                                    <div className="space-y-2">
                                                        <p className="font-black text-foreground text-lg leading-none">{item.medicine.name}</p>
                                                        <div className="flex flex-wrap gap-1.5 pt-1">
                                                            {item.fefoBreakdown.map((b, i) => (
                                                                <Badge key={i} variant="outline" className="text-[9px] bg-background border-border text-foreground/60 font-bold tracking-tight py-0">
                                                                    {b.lotNumber} <span className="opacity-30 mx-1">/</span> {b.qty}
                                                                </Badge>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <div className="inline-flex items-center justify-center p-2 bg-muted rounded-xl font-black text-foreground min-w-10">
                                                        {item.quantity}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-right font-bold text-muted-foreground text-sm">
                                                    {parseFloat(item.medicine.sellingPrice).toLocaleString()}
                                                </TableCell>
                                                <TableCell className="text-right font-black text-foreground text-lg">
                                                    {(parseFloat(item.medicine.sellingPrice) * item.quantity).toLocaleString()} <span className="text-[10px] font-normal text-muted-foreground ml-1">FBu</span>
                                                </TableCell>
                                                <TableCell className="pr-6 text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="size-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-all"
                                                        onClick={() => removeFromCart(item.medicine.id)}
                                                    >
                                                        <Trash2 className="size-5" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <div className={cn("transition-all duration-500",
                        cart.length > 0 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8 pointer-events-none")}>
                        <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-sidebar text-sidebar-foreground border-8 border-background/10 ring-1 ring-background/5">
                            <CardContent className="p-10">
                                <div className="flex flex-col xl:flex-row gap-12 items-center xl:items-end w-full">
                                    <div className="flex-1 space-y-6 w-full">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-sidebar-foreground/50 ml-1">Identification Client (Reçu)</label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-sidebar-foreground/40 group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    placeholder="Nom complet du client ou patient..."
                                                    className="bg-sidebar-accent/50 border-sidebar-border text-sidebar-foreground pl-12 h-16 text-lg font-bold focus-visible:ring-primary focus-visible:ring-offset-0 rounded-2xl"
                                                    value={customerName}
                                                    onChange={(e) => setCustomerName(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 text-emerald-400 text-xs font-black tracking-widest uppercase bg-emerald-500/10 w-fit px-4 py-2 rounded-lg border border-emerald-500/20">
                                            <CheckCircle2 className="size-4" /> Paiement Comptant / Cash
                                        </div>
                                    </div>

                                    <div className="w-full xl:w-auto flex flex-col sm:flex-row xl:flex-col items-center xl:items-end gap-8 pt-4">
                                        <div className="flex flex-col items-center xl:items-end gap-1">
                                            <span className="text-[10px] font-black uppercase text-sidebar-foreground/50 tracking-[0.3em]">Total de la Transaction</span>
                                            <h2 className="text-6xl font-black tracking-tighter tabular-nums text-primary drop-shadow-[0_0_15px_rgba(var(--primary),0.3)]">
                                                {totalAmount.toLocaleString()} <span className="text-xl font-normal opacity-50 ml-1">FBu</span>
                                            </h2>
                                        </div>
                                        <Button
                                            size="lg"
                                            className="w-full sm:w-64 h-20 text-lg font-black uppercase tracking-[0.2em] shadow-2xl shadow-primary/40 hover:scale-[1.05] transition-all duration-300 active:scale-[0.95] rounded-2xl flex items-center justify-center gap-3 bg-primary text-primary-foreground"
                                            onClick={confirmSale}
                                            disabled={loading || cart.length === 0}
                                        >
                                            {loading ? <div className="size-6 animate-spin border-4 border-white/20 border-t-white rounded-full" /> : "Encaisser & Imprimer"}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                    <Card className="border-border shadow-xl rounded-3xl overflow-hidden h-fit sticky top-24 bg-card/70 backdrop-blur-md">
                        <CardHeader className="bg-muted/30 border-b px-8 py-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-muted rounded-2xl">
                                    <Search className="size-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl font-black tracking-tight">Catalogue Stocks</CardTitle>
                                    <CardDescription className="font-semibold text-muted-foreground uppercase text-[9px] tracking-widest">Disponibles pour vente</CardDescription>
                                </div>
                            </div>
                            <div className="mt-6">
                                <Input
                                    placeholder="Filtrer par nom ou générique..."
                                    className="h-12 bg-background rounded-xl border-input focus-visible:ring-primary"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[calc(100vh-400px)] overflow-y-auto custom-scrollbar">
                                <div className="divide-y divide-border">
                                    {filteredMedicines.length === 0 ? (
                                        <div className="p-20 text-center text-muted-foreground flex flex-col items-center gap-4">
                                            <Package className="size-16 opacity-5" />
                                            <p className="italic font-medium">Aucun produit en stock</p>
                                        </div>
                                    ) : (
                                        filteredMedicines.map((med) => (
                                            <div key={med.id} className="p-6 hover:bg-muted/50 group transition-all relative">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div className="space-y-1">
                                                        <p className="font-black text-foreground group-hover:text-primary transition-colors text-base">{med.name}</p>
                                                        <p className="text-[9px] text-muted-foreground uppercase font-black tracking-widest inline-block bg-muted px-2 py-0.5 rounded italic">
                                                            {med.genericName || "Standard"}
                                                        </p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="font-black text-foreground text-lg">
                                                            {parseFloat(med.sellingPrice).toLocaleString()}
                                                            <span className="text-[10px] text-muted-foreground ml-1">FBu</span>
                                                        </p>
                                                        <Badge
                                                            className={cn("text-[9px] font-black tracking-widest border-none px-2 py-0.5 h-auto",
                                                                parseFloat(med.totalAvailable) < 10 ? "bg-red-500/20 text-red-500" : "bg-primary/20 text-primary")}
                                                        >
                                                            STOCK: {parseFloat(med.totalAvailable)}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="flex gap-3">
                                                    <div className="relative w-24">
                                                        <Input
                                                            type="number"
                                                            className="h-10 text-center font-black border-input rounded-xl bg-background"
                                                            min={1}
                                                            defaultValue={1}
                                                            id={`qty-${med.id}`}
                                                        />
                                                        <div className="absolute -top-2 left-2 bg-card px-1 text-[8px] font-black text-muted-foreground uppercase">Qté</div>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="h-10 flex-1 gap-2 font-black uppercase text-[10px] tracking-widest rounded-xl transition-all hover:gap-4 bg-primary text-primary-foreground"
                                                        onClick={() => {
                                                            const input = document.getElementById(`qty-${med.id}`) as HTMLInputElement
                                                            addToCart(med, parseFloat(input.value) || 1)
                                                        }}
                                                    >
                                                        Ajouter <ChevronRight className="size-3" />
                                                    </Button>
                                                </div>

                                                <div className="mt-4 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="size-3 text-muted-foreground/50" />
                                                        <div className="flex gap-1 overflow-hidden max-w-[200px]">
                                                            {med.lots.slice(0, 2).map((l, i) => (
                                                                <span key={i} className="text-[9px] text-muted-foreground font-bold whitespace-nowrap">
                                                                    {format(new Date(l.expiryDate), 'MM/yy')}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <span className="text-[9px] font-black text-muted-foreground/30 italic uppercase">FEFO Active</span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
