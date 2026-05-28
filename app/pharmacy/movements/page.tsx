"use client"

import { useState, useEffect } from "react"
import { History, Search, ArrowUpRight, ArrowDownLeft, Package } from "lucide-react"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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

interface Movement {
    id: string
    type: "sale" | "purchase" | "adjustment"
    quantity: string
    createdAt: string
    medicine: { name: string, genericName: string | null }
    lot?: { lotNumber: string } | null
}

export default function MovementsAuditPage() {
    const [movements, setMovements] = useState<Movement[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")

    useEffect(() => {
        async function fetchMovements() {
            try {
                const res = await fetch("/api/pharmacy/movements")
                const data = await res.json()
                if (res.ok) setMovements(data.data)
            } catch (err) {
                console.error("Failed to fetch movements")
            } finally {
                setLoading(false)
            }
        }
        fetchMovements()
    }, [])

    const filteredMovements = movements.filter(m =>
        m.medicine.name.toLowerCase().includes(search.toLowerCase()) ||
        m.lot?.lotNumber?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-6 space-y-6 max-w-[1400px] mx-auto text-foreground">
            <PageHeader
                title="Audit des Flux & Mouvements"
                description="Journal détaillé des entrées et sorties de stock"
            />

            <Card className="border-border bg-card shadow-xl rounded-3xl overflow-hidden border-t-8 border-t-sidebar">
                <CardHeader className="pb-3 border-b bg-muted/30 px-8 py-6">
                    <div className="relative max-w-md group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            placeholder="Rechercher par médicament ou lot..."
                            className="pl-11 h-11 bg-background border-input rounded-xl focus-visible:ring-primary shadow-sm"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                                <TableHead className="pl-8 font-black text-[9px] uppercase tracking-[0.2em] text-muted-foreground h-12">Horodatage</TableHead>
                                <TableHead className="font-black text-[9px] uppercase tracking-[0.2em] text-muted-foreground h-12">Médicament</TableHead>
                                <TableHead className="font-black text-[9px] uppercase tracking-[0.2em] text-muted-foreground h-12">N° de Lot</TableHead>
                                <TableHead className="font-black text-[9px] uppercase tracking-[0.2em] text-muted-foreground h-12">Type / Flux</TableHead>
                                <TableHead className="text-right font-black text-[9px] uppercase tracking-[0.2em] text-muted-foreground pr-8 h-12">Quantité</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={5} className="h-48 text-center text-muted-foreground italic">Chargement des données d'audit...</TableCell></TableRow>
                            ) : filteredMovements.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4 text-muted-foreground/30">
                                            <History className="size-16 opacity-5" />
                                            <p className="font-bold">Aucun mouvement enregistré</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredMovements.map((m) => (
                                    <TableRow key={m.id} className="hover:bg-muted/50 transition-all border-border group">
                                        <TableCell className="pl-8 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-foreground/80">{format(new Date(m.createdAt), "dd MMM yyyy", { locale: fr })}</span>
                                                <span className="text-[10px] text-muted-foreground font-mono tracking-tighter">{format(new Date(m.createdAt), "HH:mm:ss")}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <div className="p-3 bg-muted rounded-2xl group-hover:bg-primary/10 transition-colors">
                                                    <Package className="size-5 text-muted-foreground/60" />
                                                </div>
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="font-black text-foreground text-lg tracking-tight">{m.medicine.name}</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 italic flex items-center gap-1.5">
                                                        {m.medicine.genericName || "—"}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <Badge variant="outline" className="font-mono text-[11px] bg-primary/5 border-primary/20 text-primary px-3 py-1 w-fit rounded-lg font-black">
                                                    {m.lot?.lotNumber ?? "—"}
                                                </Badge>
                                                <span className="text-[9px] text-muted-foreground/50 uppercase tracking-tighter px-1">Référence Lot</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {m.type === 'purchase' ? (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 text-emerald-500 rounded-lg border border-emerald-500/20">
                                                        <ArrowDownLeft className="size-3.5" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest leading-none pt-0.5">Entrée Achat</span>
                                                    </div>
                                                ) : m.type === 'sale' ? (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-orange-500/10 text-orange-500 rounded-lg border border-orange-500/20">
                                                        <ArrowUpRight className="size-3.5" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest leading-none pt-0.5">Sortie Vente</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/10 text-blue-500 rounded-lg border border-blue-500/20">
                                                        <History className="size-3.5" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest leading-none pt-0.5">Ajustement</span>
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-8">
                                            <span className={cn("text-xl font-black tracking-tighter tabular-nums", m.type === 'purchase' ? "text-emerald-500" : "text-foreground")}>
                                                {m.type === 'sale' ? `-${parseFloat(m.quantity)}` : `+${parseFloat(m.quantity)}`}
                                            </span>
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
