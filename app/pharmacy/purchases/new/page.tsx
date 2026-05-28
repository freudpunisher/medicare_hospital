"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Trash2, ArrowLeft, Save, Truck, Package, Search, UserPlus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
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
import { toast } from "sonner"
import { PageHeader } from "@/components/page-header"

interface Supplier {
    id: string
    name: string
    contactName?: string | null
    phone?: string | null
}

interface Medicine {
    id: string
    name: string
    genericName: string | null
}

interface PurchaseItem {
    medicineId: string
    quantity: number
    unitPrice: number
    lotNumber: string
    expiryDate: string
}

export default function NewPurchasePage() {
    const router = useRouter()
    const [suppliers, setSuppliers] = useState<Supplier[]>([])
    const [medicines, setMedicines] = useState<Medicine[]>([])
    const [selectedSupplier, setSelectedSupplier] = useState("")
    const [items, setItems] = useState<PurchaseItem[]>([])
    const [loading, setLoading] = useState(false)

    // New supplier dialog state
    const [supplierDialogOpen, setSupplierDialogOpen] = useState(false)
    const [newSupplier, setNewSupplier] = useState({ name: "", contactName: "", phone: "", email: "", address: "" })
    const [savingSupplier, setSavingSupplier] = useState(false)

    async function fetchSuppliers() {
        const res = await fetch("/api/pharmacy/suppliers")
        const data = await res.json()
        if (res.ok) setSuppliers(data.data)
    }

    useEffect(() => {
        async function fetchData() {
            try {
                const [, medRes] = await Promise.all([
                    fetchSuppliers(),
                    fetch("/api/pharmacy/medicines")
                ])
                const medData = await medRes.json()
                if (medRes.ok) setMedicines(medData.data)
            } catch (err) {
                toast.error("Échec du chargement des données")
            }
        }
        fetchData()
    }, [])

    const handleCreateSupplier = async () => {
        if (!newSupplier.name) return toast.error("Nom du fournisseur requis")
        setSavingSupplier(true)
        try {
            const res = await fetch("/api/pharmacy/suppliers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newSupplier)
            })
            const data = await res.json()
            if (res.ok) {
                toast.success(`Fournisseur "${data.data.name}" créé`)
                setSupplierDialogOpen(false)
                setNewSupplier({ name: "", contactName: "", phone: "", email: "", address: "" })
                await fetchSuppliers()
                setSelectedSupplier(data.data.id)
            } else {
                toast.error(data.error || "Erreur lors de la création")
            }
        } catch {
            toast.error("Erreur réseau")
        } finally {
            setSavingSupplier(false)
        }
    }

    const addItem = () => {
        setItems([...items, { medicineId: "", quantity: 1, unitPrice: 0, lotNumber: "", expiryDate: "" }])
    }

    const removeItem = (index: number) => {
        setItems(items.filter((_, i) => i !== index))
    }

    const updateItem = (index: number, field: keyof PurchaseItem, value: any) => {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    const handleSubmit = async () => {
        if (!selectedSupplier) return toast.error("Veuillez sélectionner un fournisseur")
        if (items.length === 0) return toast.error("Ajoutez au moins un article")
        if (items.some(i => !i.medicineId || !i.lotNumber || !i.expiryDate))
            return toast.error("Veuillez remplir tous les champs obligatoires")

        setLoading(true)
        try {
            const res = await fetch("/api/pharmacy/purchases", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    supplierId: selectedSupplier,
                    items: items.map(i => ({
                        ...i,
                        quantity: Number(i.quantity),
                        unitPrice: Number(i.unitPrice)
                    }))
                })
            })

            if (res.ok) {
                toast.success("Achat enregistré avec succès")
                router.push("/pharmacy/purchases")
            } else {
                const data = await res.json()
                toast.error(data.error || "Une erreur est survenue")
            }
        } catch (err) {
            toast.error("Erreur réseau")
        } finally {
            setLoading(false)
        }
    }

    return (
        <>
            <div className="p-6 space-y-6 mx-auto text-foreground">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full hover:bg-muted">
                            <ArrowLeft className="size-4" />
                        </Button>
                        <PageHeader
                            title="Saisir un Nouvel Achat"
                            description="Entrée de stock et création de nouveaux lots de médicaments"
                        />
                    </div>
                    <Button onClick={handleSubmit} disabled={loading} className="gap-2 bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                        <Save className="size-4" /> {loading ? "Enregistrement..." : "Enregistrer l'Achat"}
                    </Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-foreground">
                    <Card className="lg:col-span-1 border-border bg-card shadow-sm rounded-2xl h-fit">
                        <CardHeader className="bg-muted/30 border-b">
                            <CardTitle className="text-lg font-black tracking-tight flex items-center gap-2">
                                <Truck className="size-4 text-primary" /> Informations Fournisseur
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 space-y-4">
                            <div className="space-y-2">
                                <div className="flex items-center justify-between mb-1">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Sélectionner Fournisseur</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 gap-1 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 px-2"
                                        onClick={() => setSupplierDialogOpen(true)}
                                    >
                                        <UserPlus className="size-3" /> Nouveau
                                    </Button>
                                </div>
                                <Select value={selectedSupplier} onValueChange={setSelectedSupplier}>
                                    <SelectTrigger className="h-11 rounded-xl bg-background border-input">
                                        <SelectValue placeholder="Choisir un fournisseur..." />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border">
                                        {suppliers.map(s => (
                                            <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl space-y-2">
                                <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest flex items-center gap-1">
                                    <Package className="size-3" /> Note Importante
                                </p>
                                <p className="text-xs text-amber-600/80 dark:text-amber-400/80 leading-relaxed italic font-medium">
                                    Chaque ligne d'achat créera automatiquement un nouveau lot de stock avec le numéro de lot et la date d'expiration spécifiés.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2 border-border bg-card shadow-xl rounded-3xl overflow-hidden">
                        <CardHeader className="bg-muted/30 border-b flex flex-row items-center justify-between py-6 px-8">
                            <div className="space-y-0.5">
                                <CardTitle className="text-xl font-black tracking-tight">Articles de Commande</CardTitle>
                                <CardDescription className="font-medium text-muted-foreground">Liste des médicaments réceptionnés</CardDescription>
                            </div>
                            <Button onClick={addItem} size="sm" className="gap-2 font-bold uppercase text-[10px] tracking-widest bg-primary text-primary-foreground">
                                <Plus className="size-3.5" /> Ajouter une Ligne
                            </Button>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-muted/30 hover:bg-muted/30 border-b">
                                            <TableHead className="pl-8 font-black text-[9px] uppercase tracking-wider text-muted-foreground h-12 w-[180px]">Médicament</TableHead>
                                            <TableHead className="font-black text-[9px] uppercase tracking-wider text-muted-foreground h-12 w-[100px]">Qty</TableHead>
                                            <TableHead className="font-black text-[9px] uppercase tracking-wider text-muted-foreground h-12 w-[120px]">P.U Achat</TableHead>
                                            <TableHead className="font-black text-[9px] uppercase tracking-wider text-muted-foreground h-12 w-[140px]">N° Lot</TableHead>
                                            <TableHead className="font-black text-[9px] uppercase tracking-wider text-muted-foreground h-12 w-[140px]">Date Exp.</TableHead>
                                            <TableHead className="w-12 h-12"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {items.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} className="h-64 text-center">
                                                    <div className="flex flex-col items-center gap-3 text-muted-foreground">
                                                        <Search className="size-10 opacity-10" />
                                                        <p className="italic font-medium">Aucun article ajouté.</p>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            items.map((item, idx) => (
                                                <TableRow key={idx} className="border-border hover:bg-muted/20 transition-colors">
                                                    <TableCell className="pl-8 py-4">
                                                        <Select onValueChange={(v) => updateItem(idx, "medicineId", v)}>
                                                            <SelectTrigger className="h-9 rounded-lg border-input bg-background">
                                                                <SelectValue placeholder="Choisir..." />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-card border-border">
                                                                {medicines.map(m => (
                                                                    <SelectItem key={m.id} value={m.id} className="py-3">
                                                                        <div className="flex flex-col gap-0.5">
                                                                            <span className="font-bold text-sm">{m.name}</span>
                                                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 italic">{m.genericName || "—"}</span>
                                                                        </div>
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Input
                                                            type="number"
                                                            className="h-9 font-bold bg-background border-input"
                                                            value={item.quantity}
                                                            onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Input
                                                            type="number"
                                                            className="h-9 font-bold bg-background border-input text-primary"
                                                            value={item.unitPrice}
                                                            onChange={(e) => updateItem(idx, "unitPrice", e.target.value)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Input
                                                            placeholder="BATCH-XX"
                                                            className="h-9 font-mono text-[10px] tracking-widest bg-background border-input"
                                                            value={item.lotNumber}
                                                            onChange={(e) => updateItem(idx, "lotNumber", e.target.value)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="py-4">
                                                        <Input
                                                            type="date"
                                                            className="h-9 text-[10px] bg-background border-input px-2"
                                                            value={item.expiryDate}
                                                            onChange={(e) => updateItem(idx, "expiryDate", e.target.value)}
                                                        />
                                                    </TableCell>
                                                    <TableCell className="pr-4 py-4">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                                                            onClick={() => removeItem(idx)}
                                                        >
                                                            <Trash2 className="size-4" />
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                            {items.length > 0 && (
                                <div className="p-8 bg-muted/30 border-t flex flex-col items-end gap-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Total de la Facture</p>
                                    <p className="text-4xl font-black tracking-tighter text-foreground tabular-nums">
                                        {items.reduce((sum, i) => sum + (Number(i.quantity) * Number(i.unitPrice)), 0).toLocaleString()} <span className="text-sm font-normal text-muted-foreground">FBu</span>
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* New Supplier Dialog */}
            <Dialog open={supplierDialogOpen} onOpenChange={setSupplierDialogOpen}>
                <DialogContent className="bg-card border-border max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="size-5 text-primary" /> Nouveau Fournisseur
                        </DialogTitle>
                        <DialogDescription>
                            Après enregistrement, le fournisseur sera automatiquement sélectionné.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 pt-2">
                        <div className="space-y-2">
                            <Label>Nom du fournisseur <span className="text-destructive">*</span></Label>
                            <Input
                                placeholder="Ex: Pharma Distribution SA"
                                value={newSupplier.name}
                                onChange={e => setNewSupplier({ ...newSupplier, name: e.target.value })}
                                className="bg-background border-input"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Personne de contact</Label>
                                <Input
                                    placeholder="Ex: Jean Dupont"
                                    value={newSupplier.contactName}
                                    onChange={e => setNewSupplier({ ...newSupplier, contactName: e.target.value })}
                                    className="bg-background border-input"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Téléphone</Label>
                                <Input
                                    placeholder="+257 XX XXX XXX"
                                    value={newSupplier.phone}
                                    onChange={e => setNewSupplier({ ...newSupplier, phone: e.target.value })}
                                    className="bg-background border-input"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Email</Label>
                            <Input
                                type="email"
                                placeholder="contact@fournisseur.com"
                                value={newSupplier.email}
                                onChange={e => setNewSupplier({ ...newSupplier, email: e.target.value })}
                                className="bg-background border-input"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Adresse</Label>
                            <Input
                                placeholder="Bujumbura, Burundi"
                                value={newSupplier.address}
                                onChange={e => setNewSupplier({ ...newSupplier, address: e.target.value })}
                                className="bg-background border-input"
                            />
                        </div>
                        <Button
                            className="w-full gap-2 bg-primary text-primary-foreground mt-2"
                            onClick={handleCreateSupplier}
                            disabled={savingSupplier}
                        >
                            <Save className="size-4" />
                            {savingSupplier ? "Enregistrement..." : "Créer le Fournisseur"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    )
}
