"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Boxes, Save, Trash2, Pill, QrCode, Edit2, LayoutGrid } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Medicine {
    id: string
    name: string
    genericName: string | null
    categoryId: string | null
    unit: string
    barcode: string | null
    sellingPrice: string | null
    isActive: boolean
    category: { name: string } | null
}

export default function MedicinesPage() {
    const [medicines, setMedicines] = useState<Medicine[]>([])
    const [categories, setCategories] = useState<{ id: string, name: string }[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingMed, setEditingMed] = useState<Medicine | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        genericName: "",
        categoryId: "",
        unit: "tablet",
        sellingPrice: "0",
        barcode: ""
    })

    async function fetchData() {
        try {
            const [medRes, catRes] = await Promise.all([
                fetch("/api/pharmacy/medicines"),
                fetch("/api/pharmacy/categories")
            ])
            const [medData, catData] = await Promise.all([medRes.json(), catRes.json()])
            if (medRes.ok) setMedicines(medData.data)
            if (catRes.ok) setCategories(catData.data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleOpenDialog = (med?: Medicine) => {
        if (med) {
            setEditingMed(med)
            setFormData({
                name: med.name,
                genericName: med.genericName || "",
                categoryId: med.categoryId || "",
                unit: med.unit,
                sellingPrice: med.sellingPrice || "0",
                barcode: med.barcode || ""
            })
        } else {
            setEditingMed(null)
            setFormData({ name: "", genericName: "", categoryId: "", unit: "tablet", sellingPrice: "0", barcode: "" })
        }
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        if (!formData.name) return toast.error("Le nom est requis")

        setLoading(true)
        try {
            const url = editingMed ? `/api/pharmacy/medicines/${editingMed.id}` : "/api/pharmacy/medicines"
            const method = editingMed ? "PUT" : "POST"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                toast.success(editingMed ? "Produit mis à jour" : "Produit ajouté")
                setIsDialogOpen(false)
                fetchData()
            }
        } catch (err) {
            toast.error("Erreur réseau")
        } finally {
            setLoading(false)
        }
    }

    const filtered = medicines.filter(m =>
        m.name.toLowerCase().includes(search.toLowerCase()) ||
        m.genericName?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto text-foreground">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader title="Catalogue Médicaments" description="Gérer la liste des produits pharmaceutiques" />
                <Button onClick={() => handleOpenDialog()} className="gap-2 bg-primary shadow-lg shadow-primary/20 rounded-full px-8 h-14 text-sm font-black uppercase tracking-widest group">
                    <Plus className="size-5 group-hover:rotate-90 transition-transform" /> Nouveau Médicament
                </Button>
            </div>

            <Card className="border-border bg-card shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/40">
                <CardHeader className="bg-muted/30 border-b px-10 py-8">
                    <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <LayoutGrid className="size-6 text-primary" /> Inventaire Master
                            </CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Product catalog / Pharmaceutical records</CardDescription>
                        </div>
                        <div className="relative flex-1 max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Rechercher par nom ou générique..."
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
                                <TableHead className="pl-10 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-16">Désignation / Générique</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-16">Classification</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-16">Format / Unité</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-16">P.U Vente</TableHead>
                                <TableHead className="text-center font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-16">Disponibilité</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground pr-10 h-16">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && medicines.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="h-24"><TableCell colSpan={6} className="text-center animate-pulse"><div className="h-4 bg-muted rounded w-3/4 mx-auto" /></TableCell></TableRow>
                                ))
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4 text-muted-foreground/20">
                                            <Boxes className="size-20 opacity-5" />
                                            <p className="font-black text-xl italic uppercase tracking-widest">Référence non trouvée</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((m) => (
                                    <TableRow key={m.id} className="hover:bg-muted/50 transition-all border-border group py-4">
                                        <TableCell className="pl-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-2xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                                    <Pill className="size-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                                </div>
                                                <div className="flex flex-col gap-1.5">
                                                    <p className="font-black text-foreground text-lg group-hover:text-primary transition-colors tracking-tight">{m.name}</p>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50 italic flex items-center gap-1.5">
                                                        <div className="size-1 rounded-full bg-primary/30" /> {m.genericName || "Standard DCI"}
                                                    </span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="text-[10px] bg-background border-border font-black uppercase tracking-widest px-3 py-1 text-muted-foreground/70">
                                                {m.category?.name || "Sans catégorie"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 font-bold text-foreground/80">
                                                <Badge className="bg-muted text-muted-foreground border-none font-black text-[9px] uppercase tracking-widest">
                                                    {m.unit}
                                                </Badge>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <span className="text-2xl font-black tracking-tighter text-emerald-500 tabular-nums">
                                                {parseFloat(m.sellingPrice || "0").toLocaleString()}
                                            </span>
                                            <span className="text-[10px] font-black text-muted-foreground ml-1">FBu</span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className={cn("border-none px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest",
                                                m.isActive ? "bg-emerald-500/20 text-emerald-500" : "bg-red-500/20 text-red-500")}>
                                                {m.isActive ? "En Vente" : "Désactivé"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-10">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                                                    onClick={() => handleOpenDialog(m)}
                                                >
                                                    <Edit2 className="size-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-muted">
                                                    <QrCode className="size-4 text-muted-foreground" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="max-w-2xl bg-card border-border shadow-2xl p-0 rounded-[2rem] overflow-hidden">
                    <DialogHeader className="bg-muted px-10 py-8 border-b">
                        <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                            {editingMed ? <Edit2 className="size-6 text-primary" /> : <Plus className="size-6 text-primary" />}
                            {editingMed ? "Détails Médicament" : "Enregistrement Produit"}
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Product identification & pricing specs</DialogDescription>
                    </DialogHeader>
                    <div className="px-10 py-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6 text-foreground">
                            <div className="col-span-2 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nom Commercial</Label>
                                <Input
                                    className="h-12 rounded-xl bg-background border-input font-bold"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Panadol"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nom Générique (Molecule)</Label>
                                <Input
                                    className="h-12 rounded-xl bg-background border-input font-medium"
                                    value={formData.genericName} onChange={e => setFormData({ ...formData, genericName: e.target.value })} placeholder="Ex: Paracetamol"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Classification / Catégorie</Label>
                                <Select value={formData.categoryId} onValueChange={v => setFormData({ ...formData, categoryId: v })}>
                                    <SelectTrigger className="h-12 rounded-xl bg-background border-input"><SelectValue placeholder="Choisir..." /></SelectTrigger>
                                    <SelectContent className="bg-card border-border">
                                        {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Unité de Vente</Label>
                                <Select value={formData.unit} onValueChange={v => setFormData({ ...formData, unit: v })}>
                                    <SelectTrigger className="h-12 rounded-xl bg-background border-input font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-card border-border">
                                        <SelectItem value="tablet">Comprimé (Tablet)</SelectItem>
                                        <SelectItem value="bottle">Flacon (Bottle)</SelectItem>
                                        <SelectItem value="box">Boîte (Box)</SelectItem>
                                        <SelectItem value="vial">Ampoule (Vial)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prix Unitaire Vente (FBu)</Label>
                                <Input
                                    type="number"
                                    className="h-12 rounded-xl bg-background border-input font-black text-primary text-xl"
                                    value={formData.sellingPrice} onChange={e => setFormData({ ...formData, sellingPrice: e.target.value })}
                                />
                            </div>
                            <div className="col-span-2 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Code Barre (Optionnel)</Label>
                                <Input
                                    className="h-12 rounded-xl bg-background border-input font-mono"
                                    value={formData.barcode} onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="pt-4 flex gap-3">
                            <Button variant="ghost" className="flex-1 rounded-xl h-14 font-black uppercase tracking-widest text-xs" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                            <Button
                                className="flex-[2] rounded-xl h-14 bg-primary font-black uppercase tracking-widest text-xs gap-2"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                <Save className="size-4" /> {loading ? "Enregistrement..." : "Confirmer les Modifications"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
