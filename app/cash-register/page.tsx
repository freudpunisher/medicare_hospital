"use client"

import { useState, useEffect } from "react"
import { Plus, User, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { toast } from "sonner"

interface Cashier {
  id: string
  fullName: string
  username: string
}

interface CashRegister {
  id: string
  name: string
  description: string
  isActive: boolean
  assignedToUserId: string | null
  createdAt: string
}

export default function CashRegisterPage() {
  const [data, setData] = useState<CashRegister[]>([])
  const [cashiers, setCashiers] = useState<Cashier[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    assignedToUserId: "none"
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [regRes, cashRes] = await Promise.all([
        fetch("/api/finance/cash-registers"),
        fetch("/api/users/cashiers")
      ])
      const regJson = await regRes.json()
      const cashJson = await cashRes.json()
      if (regRes.ok) setData(regJson.data)
      if (cashRes.ok) setCashiers(cashJson.data)
    } catch (err) {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!form.name) return
    setSaving(true)
    try {
      const res = await fetch("/api/finance/cash-registers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          assignedToUserId: form.assignedToUserId === "none" ? null : form.assignedToUserId
        })
      })
      if (res.ok) {
        toast.success("Caisse ajoutée avec succès")
        setOpen(false)
        setForm({ name: "", description: "", assignedToUserId: "none" })
        fetchData()
      } else {
        toast.error("Erreur lors de la création")
      }
    } catch (err) {
      toast.error("Erreur réseau")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <PageHeader title="Gestion des Caisses" description="Configuration et affectation des terminaux de paiement">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
              <Plus className="size-4 mr-2" />Nouvelle Caisse
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
            <DialogHeader className="p-8 bg-primary text-primary-foreground">
              <DialogTitle className="text-xl font-black uppercase tracking-tight text-white">Ajouter une Caisse</DialogTitle>
              <DialogDescription className="text-primary-foreground/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                Créez un nouveau terminal et affectez un caissier
              </DialogDescription>
            </DialogHeader>

            <div className="p-8 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nom de la Caisse</Label>
                <Input
                  className="h-12 rounded-2xl border-muted bg-muted/20 font-bold focus-visible:ring-primary"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Réception Principale"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Caissier Affecté (Facultatif)</Label>
                <Select value={form.assignedToUserId} onValueChange={(v) => setForm((f) => ({ ...f, assignedToUserId: v }))}>
                  <SelectTrigger className="h-12 rounded-2xl border-muted bg-muted/20 font-bold focus:ring-primary">
                    <SelectValue placeholder="Choisir un caissier" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="none" className="font-bold italic">Aucun caissier (Libre)</SelectItem>
                    {cashiers.map((c) => (
                      <SelectItem key={c.id} value={c.id} className="font-bold">{c.fullName || c.username}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-[9px] text-muted-foreground italic ml-1">* Seuls les utilisateurs avec le rôle 'Caissier' sont listés</p>
              </div>
            </div>

            <DialogFooter className="p-6 bg-muted/30 border-t border-muted/50 gap-3">
              <Button variant="ghost" className="rounded-full font-black uppercase text-[10px] tracking-widest" onClick={() => setOpen(false)}>
                Annuler
              </Button>
              <Button
                className="rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
                onClick={handleAdd}
                disabled={saving}
              >
                {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : "Créer la Caisse"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-muted/50">
                <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-muted-foreground">Nom / ID</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Caissier Assigné</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Date de Création</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground pr-8 text-right">Statut</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center">
                    <Loader2 className="size-8 animate-spin mx-auto text-primary opacity-20" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-48 text-center text-muted-foreground font-bold italic opacity-30">
                    Aucune caisse configurée
                  </TableCell>
                </TableRow>
              ) : data.map((reg) => {
                const assigned = cashiers.find(c => c.id === reg.assignedToUserId)
                return (
                  <TableRow key={reg.id} className="border-muted/50 hover:bg-white/50 transition-colors">
                    <TableCell className="pl-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-sm uppercase tracking-tight text-foreground">{reg.name}</span>
                        <span className="text-[9px] text-muted-foreground font-mono">{reg.id.split('-')[0]}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {assigned ? (
                        <div className="flex items-center gap-2">
                          <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                            <User className="size-4" />
                          </div>
                          <span className="text-sm font-bold text-slate-800">{assigned.fullName || assigned.username}</span>
                        </div>
                      ) : (
                        <span className="text-xs font-bold text-muted-foreground italic">Non assignée</span>
                      )}
                    </TableCell>
                    <TableCell className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {new Date(reg.createdAt).toLocaleDateString("fr-FR", { day: '2-digit', month: 'short', year: 'numeric' })}
                    </TableCell>
                    <TableCell className="pr-8 text-right">
                      <StatusBadge active={reg.isActive} />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
