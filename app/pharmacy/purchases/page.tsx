"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, Eye, Truck, ShoppingBag } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface Purchase {
    id: string
    orderDate: string
    status: string
    totalAmount: string
    supplier: {
        name: string
    }
    items: Array<{
        id: string
        quantity: string
        medicine: { name: string }
    }>
}

export default function PurchasesHistoryPage() {
    const router = useRouter()
    const [purchases, setPurchases] = useState<Purchase[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        async function fetchPurchases() {
            try {
                const res = await fetch("/api/pharmacy/purchases")
                const data = await res.json()
                if (res.ok) setPurchases(data.data)
            } catch (err) {
                console.error("Failed to fetch purchases")
            } finally {
                setLoading(false)
            }
        }
        fetchPurchases()
    }, [])

    const filteredPurchases = purchases.filter(p =>
        p.supplier.name.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
                <PageHeader
                    title="Achats & Réapprovisionnement"
                    description="Historique des commandes fournisseurs et entrées en stock"
                />
                <Button onClick={() => router.push("/pharmacy/purchases/new")} className="gap-2 bg-primary text-primary-foreground">
                    <Plus className="size-4" /> Nouvel Achat
                </Button>
            </div>

            <Card className="border-border bg-card shadow-sm rounded-3xl overflow-hidden bg-card/50 backdrop-blur-sm">
                <CardHeader className="pb-3 border-b bg-muted/30 px-8 py-6">
                    <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
                        <div className="relative flex-1 max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Rechercher par fournisseur ou ID..."
                                className="pl-11 h-11 bg-background border-input rounded-xl focus-visible:ring-primary shadow-sm"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                                <TableHead className="w-[200px] font-black text-[9px] uppercase tracking-[0.2em] text-muted-foreground pl-8 h-12">Date de Commande</TableHead>
                                <TableHead className="font-black text-[9px] uppercase tracking-[0.2em] text-muted-foreground h-12">Fournisseur</TableHead>
                                <TableHead className="text-center font-black text-[9px] uppercase tracking-[0.2em] text-muted-foreground h-12">Articles</TableHead>
                                <TableHead className="text-right font-black text-[9px] uppercase tracking-[0.2em] text-muted-foreground h-12">Montant Total</TableHead>
                                <TableHead className="text-center font-black text-[9px] uppercase tracking-[0.2em] text-muted-foreground h-12">Statut</TableHead>
                                <TableHead className="text-right font-black text-[9px] uppercase tracking-[0.2em] text-muted-foreground pr-8 h-12">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell colSpan={6} className="h-20 px-8 animate-pulse text-muted-foreground italic text-center">Chargement des achats...</TableCell>
                                    </TableRow>
                                ))
                            ) : filteredPurchases.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center text-muted-foreground italic flex flex-col items-center justify-center gap-2">
                                        <ShoppingBag className="size-10 opacity-5" />
                                        <span>Aucun achat enregistré</span>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredPurchases.map((p) => (
                                    <TableRow key={p.id} className="hover:bg-muted/50 transition-all border-border group">
                                        <TableCell className="pl-8 py-5">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground">{format(new Date(p.orderDate), "dd MMM yyyy", { locale: fr })}</span>
                                                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{format(new Date(p.orderDate), "HH:mm")}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="p-2 bg-muted rounded-lg group-hover:bg-primary/10 transition-colors">
                                                    <Truck className="size-4 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>
                                                <span className="font-black text-foreground/80">{p.supplier.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center gap-1">
                                                <Badge variant="secondary" className="font-black text-[10px] bg-muted text-muted-foreground">
                                                    {p.items.length} Medicines
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-lg font-black tracking-tighter text-foreground tabular-nums">
                                                {parseFloat(p.totalAmount).toLocaleString()} <span className="text-[10px] text-muted-foreground font-normal">FBu</span>
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className="bg-emerald-500/20 text-emerald-500 hover:bg-emerald-500/30 border-none font-black text-[9px] uppercase tracking-widest px-2 py-0.5">
                                                Réceptionné
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-primary rounded-full bg-background shadow-sm border border-border">
                                                <Eye className="size-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
