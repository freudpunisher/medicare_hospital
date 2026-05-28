"use client"

import { useState, useEffect } from "react"
import { Search, Package, AlertTriangle, Calendar, Info, TrendingUp, DollarSign, Boxes, History } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format, isBefore, addMonths } from "date-fns"
import { fr } from "date-fns/locale"

interface StockMedicine {
    id: string
    name: string
    genericName: string | null
    unit: string
    sellingPrice: string
    totalAvailable: string
    lots: Array<{
        id: string
        lotNumber: string
        quantityRemaining: string
        expiryDate: string
    }>
}

export default function StockMonitoringPage() {
    const [stock, setStock] = useState<StockMedicine[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        async function fetchStock() {
            try {
                const res = await fetch("/api/pharmacy/stock")
                const data = await res.json()
                if (res.ok) setStock(data.data)
            } catch (err) {
                console.error("Failed to fetch stock")
            } finally {
                setLoading(false)
            }
        }
        fetchStock()
    }, [])

    const filteredStock = stock.filter(item =>
        item.name.toLowerCase().includes(search.toLowerCase()) ||
        item.genericName?.toLowerCase().includes(search.toLowerCase())
    )

    const stats = {
        totalItems: stock.length,
        lowStock: stock.filter(item => parseFloat(item.totalAvailable) < 10).length,
        nearExpiry: stock.filter(item => item.lots?.some(l => isBefore(new Date(l.expiryDate), addMonths(new Date(), 3)))).length,
        totalValue: stock.reduce((sum, item) => sum + (parseFloat(item.totalAvailable) * parseFloat(item.sellingPrice)), 0)
    }

    return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto text-foreground">
            <PageHeader
                title="État des Stocks & Inventaire"
                description="Surveillance en temps réel des niveaux de stock et alertes d'expiration"
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Produit Référencés" value={stats.totalItems} icon={Package} color="blue" />
                <StatCard title="Stock Faible" value={stats.lowStock} icon={TrendingUp} color="orange" alert={stats.lowStock > 0} />
                <StatCard title="Péremption Proche" value={stats.nearExpiry} icon={AlertTriangle} color="red" alert={stats.nearExpiry > 0} />
                <StatCard title="Valeur Estimée" value={`${stats.totalValue.toLocaleString()} FBu`} icon={DollarSign} color="emerald" />
            </div>

            <Card className="border-border bg-card shadow-xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/40">
                <CardHeader className="bg-muted/30 border-b px-10 py-8">
                    <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <Boxes className="size-6 text-primary" /> Inventaire par Lot
                            </CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">FEFO-based stock tracking enabled / Real-time availability</CardDescription>
                        </div>
                        <div className="relative flex-1 max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Rechercher un médicament..."
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
                                <TableHead className="w-[300px] font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground pl-10 h-16">Médicament / Spécialité</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-16">Stock Global</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-16 text-center">Décomposition des Lots (N° & Qty)</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground pr-10 h-16">Niveau de Stock</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="h-24"><TableCell colSpan={4} className="text-center italic animate-pulse text-muted-foreground font-black uppercase text-[10px] tracking-widest py-12">Synchronisation en cours...</TableCell></TableRow>
                                ))
                            ) : filteredStock.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4 text-muted-foreground/20">
                                            <Package className="size-20 opacity-5" />
                                            <p className="font-black text-xl italic uppercase tracking-widest">Aucun stock disponible</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredStock.map((item) => {
                                    const total = parseFloat(item.totalAvailable || "0")
                                    const isLow = total < 10
                                    const isOut = total === 0
                                    return (
                                        <TableRow key={item.id} className="hover:bg-muted/50 transition-all border-border group py-4">
                                            <TableCell className="pl-10 py-8">
                                                <div className="flex flex-col gap-1.5">
                                                    <p className="font-black text-foreground text-xl group-hover:text-primary transition-colors tracking-tight">{item.name}</p>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 flex items-center gap-1.5">
                                                        <div className="size-1 rounded-full bg-primary/40" /> {item.genericName || "Standard"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <div className="flex items-baseline gap-1">
                                                        <span className={cn("text-4xl font-black tracking-tighter tabular-nums", isOut ? "text-red-500" : isLow ? "text-amber-500" : "text-foreground")}>
                                                            {total}
                                                        </span>
                                                        <span className="text-xs font-black uppercase text-muted-foreground/40">{item.unit}s</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-wrap items-center justify-center gap-3 py-2">
                                                    {(item.lots || []).length === 0 ? (
                                                        <Badge variant="outline" className="text-[10px] font-black uppercase border-dashed text-red-500/40 bg-red-500/5 px-4 py-2 rounded-xl">
                                                            Aucun lot actif
                                                        </Badge>
                                                    ) : (
                                                        item.lots.map((lot) => {
                                                            const expiringSoon = isBefore(new Date(lot.expiryDate), addMonths(new Date(), 3))
                                                            return (
                                                                <TooltipProvider key={lot.id}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div className={cn(
                                                                                "flex flex-col gap-1 p-3 rounded-2xl border-2 transition-all hover:scale-105 cursor-help min-w-[120px]",
                                                                                expiringSoon
                                                                                    ? "bg-red-500/5 border-red-500/20 shadow-sm shadow-red-500/5"
                                                                                    : "bg-muted/40 border-border group-hover:bg-background group-hover:border-primary/20"
                                                                            )}>
                                                                                <div className="flex items-center justify-between gap-4">
                                                                                    <span className={cn("font-mono text-xs font-black tracking-tighter", expiringSoon ? "text-red-500" : "text-foreground/70")}>
                                                                                        {lot.lotNumber}
                                                                                    </span>
                                                                                    {expiringSoon && <AlertTriangle className="size-3 text-red-500 animate-pulse" />}
                                                                                </div>
                                                                                <div className="flex items-baseline gap-1">
                                                                                    <span className={cn("text-lg font-black tracking-tighter", expiringSoon ? "text-red-600" : "text-primary")}>
                                                                                        {parseFloat(lot.quantityRemaining)}
                                                                                    </span>
                                                                                    <span className="text-[8px] font-black uppercase text-muted-foreground/40">Rest.</span>
                                                                                </div>
                                                                            </div>
                                                                        </TooltipTrigger>
                                                                        <TooltipContent side="top" className="bg-card border-border shadow-2xl p-4 rounded-xl">
                                                                            <div className="space-y-2">
                                                                                <p className="font-black text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                                                                                    <Calendar className="size-3" /> Échéance de Péremption
                                                                                </p>
                                                                                <p className="font-black text-foreground text-lg tracking-tight">
                                                                                    {format(new Date(lot.expiryDate), 'dd MMMM yyyy', { locale: fr })}
                                                                                </p>
                                                                                {expiringSoon && (
                                                                                    <div className="px-3 py-1 bg-red-500/10 text-red-500 rounded-lg text-[9px] font-black uppercase tracking-tighter text-center">
                                                                                        Produit à surveiller
                                                                                    </div>
                                                                                )}
                                                                            </div>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            )
                                                        })
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge className={cn("border-none px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm",
                                                    isOut ? "bg-red-500 text-white animate-pulse shadow-red-500/40" :
                                                        isLow ? "bg-amber-500 text-white shadow-amber-500/20" :
                                                            "bg-emerald-500 text-white shadow-emerald-500/20")}>
                                                    {isOut ? "Urgent : Rupture" : isLow ? "Réapprovisionner" : "Stock Sain"}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right pr-10">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-xl font-black text-foreground">{parseFloat(item.sellingPrice).toLocaleString()}</span>
                                                    <span className="text-[10px] font-black text-muted-foreground uppercase opacity-50">FBu / unité</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, color, alert }: any) {
    const colors: any = {
        blue: "bg-blue-500/10 text-blue-500",
        orange: "bg-orange-500/10 text-orange-500",
        red: "bg-red-500/10 text-red-500",
        emerald: "bg-emerald-500/10 text-emerald-500"
    }

    return (
        <Card className={cn("border-border bg-card shadow-sm transition-all hover:scale-[1.02] rounded-[1.5rem]", alert && "ring-4 ring-red-500/20 border-red-500/20")}>
            <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                    <div className={cn("p-4 rounded-2xl shadow-inner", colors[color])}>
                        <Icon className="size-6" />
                    </div>
                    {alert && <div className="size-3 rounded-full bg-red-500 animate-ping" />}
                </div>
                <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 mb-2">{title}</p>
                    <p className="text-4xl font-black tracking-tighter text-foreground tabular-nums">{value}</p>
                </div>
            </CardContent>
        </Card>
    )
}
