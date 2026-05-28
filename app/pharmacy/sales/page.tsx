"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Search, Plus, Eye, User, Calendar, Receipt, TrendingUp, CreditCard, History } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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
import { cn } from "@/lib/utils"

interface Sale {
    id: string
    saleDate: string
    customerName: string | null
    totalAmount: string
    itemCount: number
    status: string
}

export default function SalesHistoryPage() {
    const router = useRouter()
    const [sales, setSales] = useState<Sale[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        async function fetchSales() {
            try {
                const res = await fetch("/api/pharmacy/sales")
                const data = await res.json()
                if (res.ok) setSales(data.data)
            } catch (err) {
                console.error("Failed to fetch sales")
            } finally {
                setLoading(false)
            }
        }
        fetchSales()
    }, [])

    const filteredSales = sales.filter(s =>
        s.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        s.id.toLowerCase().includes(search.toLowerCase())
    )

    const stats = {
        totalRevenue: sales.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0),
        saleCount: sales.length,
        avgTicket: sales.length > 0 ? sales.reduce((sum, s) => sum + parseFloat(s.totalAmount), 0) / sales.length : 0
    }

    return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto text-foreground">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title="Historique des Ventes"
                    description="Suivi des transactions et encaissements de la pharmacie"
                />
                <Button
                    onClick={() => router.push("/pharmacy/sales/new")}
                    className="gap-2 bg-primary shadow-lg shadow-primary/20 rounded-full px-8 h-14 text-sm font-black uppercase tracking-widest group"
                >
                    <Plus className="size-5 group-hover:rotate-90 transition-transform" /> Nouvelle Vente
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Chiffre d'Affaires" value={`${stats.totalRevenue.toLocaleString()} FBu`} icon={TrendingUp} color="emerald" />
                <StatCard title="Nombre de Ventes" value={stats.saleCount} icon={Receipt} color="blue" />
                <StatCard title="Panier Moyen" value={`${stats.avgTicket.toLocaleString(undefined, { maximumFractionDigits: 0 })} FBu`} icon={CreditCard} color="orange" />
            </div>

            <Card className="border-border bg-card shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/40">
                <CardHeader className="bg-muted/30 border-b px-10 py-8">
                    <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <History className="size-6 text-primary" /> Journal des Transactions
                            </CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Real-time sales ledger / Fiscal audit trail</CardDescription>
                        </div>
                        <div className="relative flex-1 max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Rechercher par client ou ID..."
                                className="pl-12 h-14 bg-background border-input rounded-[1.25rem] focus-visible:ring-primary shadow-sm text-lg font-medium"
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
                                <TableHead className="pl-10 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-16">Horodatage / ID</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-16">Client / Patient</TableHead>
                                <TableHead className="text-center font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-16">Composition</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-16">Montant Total</TableHead>
                                <TableHead className="text-center font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-16">Statut</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground pr-10 h-16">Détails</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="h-24"><TableCell colSpan={6} className="text-center animate-pulse"><div className="h-4 bg-muted rounded w-3/4 mx-auto" /></TableCell></TableRow>
                                ))
                            ) : filteredSales.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4 text-muted-foreground/20">
                                            <Receipt className="size-20 opacity-5" />
                                            <p className="font-black text-xl italic uppercase tracking-widest">Aucune vente enregistrée</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSales.map((sale) => (
                                    <TableRow
                                        key={sale.id}
                                        className="cursor-pointer hover:bg-muted/50 transition-all border-border group"
                                        onClick={() => router.push(`/pharmacy/sales/${sale.id}`)}
                                    >
                                        <TableCell className="pl-10 py-8">
                                            <div className="flex flex-col">
                                                <span className="font-black text-foreground text-lg">{format(new Date(sale.saleDate), "dd MMM yyyy", { locale: fr })}</span>
                                                <span className="text-[10px] text-muted-foreground font-black uppercase tracking-widest mt-0.5">
                                                    ID: {sale.id.slice(0, 8)} • {format(new Date(sale.saleDate), "HH:mm")}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-4">
                                                <div className="size-10 rounded-xl bg-muted flex items-center justify-center">
                                                    <User className="size-4 text-muted-foreground" />
                                                </div>
                                                <span className="font-bold text-foreground/80">{sale.customerName || "Anonyme"}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-xl font-black tracking-tighter tabular-nums">{sale.itemCount || 0}</span>
                                                <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/50 italic">Articles</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-2xl font-black tracking-tighter text-emerald-500 tabular-nums">
                                                {parseFloat(sale.totalAmount).toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-black text-muted-foreground ml-1">FBu</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className="bg-emerald-500/15 text-emerald-500 border-none font-black text-[10px] uppercase tracking-[0.2em] px-4 py-1.5 rounded-full">
                                                Payé
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-10">
                                            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-2xl bg-muted/50 group-hover:bg-primary group-hover:text-primary-foreground transition-all">
                                                <Eye className="size-5" />
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

function StatCard({ title, value, icon: Icon, color }: any) {
    const colors: any = {
        blue: "bg-blue-500/10 text-blue-500",
        emerald: "bg-emerald-500/10 text-emerald-500",
        orange: "bg-orange-500/10 text-orange-500",
    }

    return (
        <Card className="border-border bg-card shadow-sm transition-all hover:scale-[1.02] rounded-[2rem]">
            <CardContent className="p-8">
                <div className={cn("p-4 rounded-2xl w-fit mb-6", colors[color])}>
                    <Icon className="size-6" />
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">{title}</p>
                    <p className="text-3xl font-black tracking-tighter text-foreground tabular-nums">{value}</p>
                </div>
            </CardContent>
        </Card>
    )
}
