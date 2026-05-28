"use client"

import { useState, useEffect } from "react"
import { Search, Plus, Tags, Save, Trash2, Edit2, Layers, Grid } from "lucide-react"
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
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Category {
    id: string
    name: string
    description: string | null
    _count?: { medicines: number }
}

export default function CategoriesPage() {
    const [categories, setCategories] = useState<Category[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingCat, setEditingCat] = useState<Category | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        description: "",
    })

    async function fetchCategories() {
        try {
            const res = await fetch("/api/pharmacy/categories")
            const data = await res.json()
            if (res.ok) setCategories(data.data)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchCategories()
    }, [])

    const handleOpenDialog = (cat?: Category) => {
        if (cat) {
            setEditingCat(cat)
            setFormData({
                name: cat.name,
                description: cat.description || "",
            })
        } else {
            setEditingCat(null)
            setFormData({ name: "", description: "" })
        }
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        if (!formData.name) return toast.error("Le nom est requis")

        setLoading(true)
        try {
            const url = editingCat ? `/api/pharmacy/categories/${editingCat.id}` : "/api/pharmacy/categories"
            const method = editingCat ? "PUT" : "POST"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            })

            if (res.ok) {
                toast.success(editingCat ? "Catégorie mise à jour" : "Catégorie ajoutée")
                setIsDialogOpen(false)
                fetchCategories()
            }
        } catch (err) {
            toast.error("Erreur réseau")
        } finally {
            setLoading(false)
        }
    }

    const filtered = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-6 space-y-8 max-w-[1400px] mx-auto text-foreground">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader title="Groupes & Typologies" description="Organiser votre catalogue par catégories thérapeutiques" />
                <Button onClick={() => handleOpenDialog()} className="gap-2 bg-primary shadow-lg shadow-primary/20 rounded-full px-8 h-14 text-sm font-black uppercase tracking-widest group">
                    <Plus className="size-5 group-hover:rotate-90 transition-transform" /> Nouvelle Catégorie
                </Button>
            </div>

            <Card className="border-border bg-card shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/40">
                <CardHeader className="bg-muted/30 border-b px-10 py-8">
                    <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <Tags className="size-6 text-primary" /> Architecture Catalogue
                            </CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Therapeutic groups / Classifications</CardDescription>
                        </div>
                        <div className="relative flex-1 max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Filtrer les catégories..."
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
                                <TableHead className="pl-10 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-16">Nom du Groupe</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-16">Description / Notes</TableHead>
                                <TableHead className="text-center font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-16">Références Liées</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground pr-10 h-16">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && categories.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="h-24"><TableCell colSpan={4} className="text-center animate-pulse"><div className="h-4 bg-muted rounded w-3/4 mx-auto" /></TableCell></TableRow>
                                ))
                            ) : filtered.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4 text-muted-foreground/20">
                                            <Layers className="size-20 opacity-5" />
                                            <p className="font-black text-xl italic uppercase tracking-widest">Aucun groupe défini</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filtered.map((c) => (
                                    <TableRow key={c.id} className="hover:bg-muted/50 transition-all border-border group py-4">
                                        <TableCell className="pl-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black shadow-inner uppercase">
                                                    {c.name[0]}
                                                </div>
                                                <p className="font-black text-foreground text-lg group-hover:text-primary transition-colors">{c.name}</p>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <p className="text-sm text-foreground/60 max-w-sm truncate italic">
                                                {c.description || "Aucune description supplémentaire"}
                                            </p>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <Badge className="bg-muted text-muted-foreground border-none font-black text-[10px] px-4 py-1 rounded-full">
                                                {c._count?.medicines || 0} Prod.
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right pr-10">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-colors"
                                                    onClick={() => handleOpenDialog(c)}
                                                >
                                                    <Edit2 className="size-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors">
                                                    <Trash2 className="size-4" />
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
                <DialogContent className="max-w-xl bg-card border-border shadow-2xl p-0 rounded-[2rem] overflow-hidden">
                    <DialogHeader className="bg-muted px-10 py-8 border-b">
                        <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                            {editingCat ? <Edit2 className="size-6 text-primary" /> : <Plus className="size-6 text-primary" />}
                            {editingCat ? "Modifier Catégorie" : "Nouveau Groupe"}
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Classification name & therapeutic notes</DialogDescription>
                    </DialogHeader>
                    <div className="px-10 py-8 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nom de la Catégorie</Label>
                                <Input
                                    className="h-12 rounded-xl bg-background border-input font-bold"
                                    value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Antibiotiques"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description (Optionnel)</Label>
                                <Input
                                    className="h-12 rounded-xl bg-background border-input font-medium"
                                    value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Détails sur l'usage thérapeutique..."
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
                                <Save className="size-4" /> {loading ? "Enregistrement..." : "Sauvegarder la Catégorie"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
