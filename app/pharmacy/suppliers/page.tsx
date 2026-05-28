"use client"

import { useState, useEffect } from "react"
import { Truck, Plus, Search, Mail, Phone, MapPin, User, Save, Trash2, Edit2 } from "lucide-react"
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
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Supplier {
    id: string
    name: string
    contactName: string | null
    phone: string | null
    email: string | null
    address: string | null
}

export default function SuppliersPage() {
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState("")
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null)
    const [formData, setFormData] = useState({
        name: "",
        contactName: "",
        phone: "",
        email: "",
        address: "",
    })

    async function fetchSuppliers() {
        try {
            const res = await fetch("/api/pharmacy/suppliers")
            const data = await res.json()
            if (res.ok) setSuppliers(data.data)
        } catch (err) {
            toast.error("Erreur lors du chargement des fournisseurs")
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchSuppliers()
    }, [])

    const handleOpenDialog = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier)
            setFormData({
                name: supplier.name,
                contactName: supplier.contactName || "",
                phone: supplier.phone || "",
                email: supplier.email || "",
                address: supplier.address || "",
            })
        } else {
            setEditingSupplier(null)
            setFormData({ name: "", contactName: "", phone: "", email: "", address: "" })
        }
        setIsDialogOpen(true)
    }

    const handleSubmit = async () => {
        if (!formData.name) return toast.error("Le nom est requis")

        setLoading(true)
        try {
            const url = editingSupplier
                ? `/api/pharmacy/suppliers/${editingSupplier.id}`
                : "/api/pharmacy/suppliers"
            const method = editingSupplier ? "PUT" : "POST"

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            })

            if (res.ok) {
                toast.success(editingSupplier ? "Fournisseur mis à jour" : "Fournisseur ajouté")
                setIsDialogOpen(false)
                fetchSuppliers()
            } else {
                const error = await res.json()
                toast.error(error.error || "Une erreur est survenue")
            }
        } catch (err) {
            toast.error("Erreur réseau")
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm("Voulez-vous supprimer ce fournisseur ?")) return

        try {
            const res = await fetch(`/api/pharmacy/suppliers/${id}`, { method: "DELETE" })
            if (res.ok) {
                toast.success("Fournisseur supprimé")
                fetchSuppliers()
            } else {
                toast.error("Erreur lors de la suppression")
            }
        } catch (err) {
            toast.error("Erreur réseau")
        }
    }

    const filteredSuppliers = suppliers.filter(s =>
        s.name.toLowerCase().includes(search.toLowerCase()) ||
        s.contactName?.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="p-6 space-y-8 max-w-[1400px] mx-auto text-foreground">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <PageHeader
                    title="Gestion des Fournisseurs"
                    description="Gérer votre réseau de partenaires pharmaceutiques"
                />
                <Button onClick={() => handleOpenDialog()} className="gap-2 bg-primary shadow-lg shadow-primary/20 rounded-full px-6 h-12 text-sm font-black uppercase tracking-widest">
                    <Truck className="size-4" /> Nouveau Fournisseur
                </Button>
            </div>

            <Card className="border-border bg-card shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-t-primary/40">
                <CardHeader className="bg-muted/30 border-b px-10 py-8">
                    <div className="flex flex-col md:flex-row md:items-center gap-6 justify-between">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                                <Truck className="size-6 text-primary" /> Carnet d'Adresses
                            </CardTitle>
                            <CardDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Supplier directory / Procurement partners</CardDescription>
                        </div>
                        <div className="relative flex-1 max-w-md group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                placeholder="Rechercher par nom ou contact..."
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
                                <TableHead className="pl-10 font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-16">Fournisseur / Identité</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-16">Contact Principal</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-16">Coordonnées</TableHead>
                                <TableHead className="font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground h-16">Localisation</TableHead>
                                <TableHead className="text-right font-black text-[10px] uppercase tracking-[0.2em] text-muted-foreground pr-10 h-16">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading && suppliers.length === 0 ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="h-24"><TableCell colSpan={5} className="text-center animate-pulse"><div className="h-4 bg-muted rounded w-3/4 mx-auto" /></TableCell></TableRow>
                                ))
                            ) : filteredSuppliers.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-4 text-muted-foreground/20">
                                            <Truck className="size-20 opacity-5" />
                                            <p className="font-black text-xl italic uppercase tracking-widest">Aucun fournisseur répertorié</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredSuppliers.map((s) => (
                                    <TableRow key={s.id} className="hover:bg-muted/50 transition-all border-border group py-4">
                                        <TableCell className="pl-10 py-8">
                                            <div className="flex items-center gap-4">
                                                <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl shadow-inner uppercase">
                                                    {s.name[0]}
                                                </div>
                                                <div className="flex flex-col">
                                                    <p className="font-black text-foreground text-lg group-hover:text-primary transition-colors">{s.name}</p>
                                                    <p className="text-[10px] font-black uppercase tracking-tighter text-muted-foreground/50">Partner ID: {s.id.slice(0, 8)}</p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-foreground/80 font-bold">
                                                <User className="size-3.5 text-primary/60" /> {s.contactName || "Non spécifié"}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col gap-1.5">
                                                <div className="flex items-center gap-2 text-sm text-foreground/70 font-medium">
                                                    <Phone className="size-3 text-muted-foreground" /> {s.phone || "—"}
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground italic">
                                                    <Mail className="size-3 opacity-50" /> {s.email || "—"}
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2 text-sm text-foreground/60 font-medium max-w-[200px] truncate">
                                                <MapPin className="size-3.5 text-muted-foreground" /> {s.address || "—"}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right pr-10">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all shadow-sm"
                                                    onClick={() => handleOpenDialog(s)}
                                                >
                                                    <Edit2 className="size-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-10 w-10 rounded-xl hover:bg-destructive/10 hover:text-destructive transition-all shadow-sm text-muted-foreground"
                                                    onClick={() => handleDelete(s.id)}
                                                >
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
                <DialogContent className="max-w-2xl bg-card border-border shadow-2xl p-0 rounded-[2rem] overflow-hidden">
                    <DialogHeader className="bg-muted px-10 py-8 border-b">
                        <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                            {editingSupplier ? <Edit2 className="size-6 text-primary" /> : <Plus className="size-6 text-primary" />}
                            {editingSupplier ? "Modifier Fournisseur" : "Nouveau Fournisseur"}
                        </DialogTitle>
                        <DialogDescription className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Partner identification & contact details</DialogDescription>
                    </DialogHeader>
                    <div className="px-10 py-8 space-y-6">
                        <div className="grid grid-cols-2 gap-6">
                            <div className="col-span-2 space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Nom du Fournisseur / Entreprise</Label>
                                <Input
                                    className="h-12 rounded-xl bg-background border-input font-bold"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Pharma SA"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Contact Principal</Label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        className="h-12 pl-11 rounded-xl bg-background border-input font-medium"
                                        value={formData.contactName}
                                        onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                                        placeholder="Jean Dupont"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Téléphone</Label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        className="h-12 pl-11 rounded-xl bg-background border-input font-mono"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+257 ..."
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        className="h-12 pl-11 rounded-xl bg-background border-input"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="contact@pharma.com"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Adresse / Localisation</Label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                    <Input
                                        className="h-12 pl-11 rounded-xl bg-background border-input"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Bujumbura, Burundi"
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="pt-4 flex gap-3">
                            <Button variant="ghost" className="flex-1 rounded-xl h-14 font-black uppercase tracking-widest text-xs" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
                            <Button
                                className="flex-[2] rounded-xl h-14 bg-primary font-black uppercase tracking-widest text-xs gap-2"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                <Save className="size-4" /> {loading ? "Enregistrement..." : (editingSupplier ? "Sauvegarder" : "Créer le Fournisseur")}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
