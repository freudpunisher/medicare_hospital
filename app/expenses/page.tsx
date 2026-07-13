"use client"

import { useState, useEffect } from "react"
import { Plus, Loader2, Landmark, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"
import { useCurrentUser } from "@/hooks/use-current-user"

interface Expense {
  id: string
  description: string
  amount: string
  category: string
  createdAt: string
  cashSessionId?: string | null
}

const categories = ["Consommables", "Maintenance", "Services", "Médical", "Utilities", "Divers"]

export default function ExpensesPage() {
  const { user } = useCurrentUser()
  const [data, setData] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [open, setOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [openSessions, setOpenSessions] = useState<any[]>([])
  const [form, setForm] = useState({
    description: "",
    amount: "",
    category: "Consommables",
    cashSessionId: "",
  })

  // Fetch current user's open session
  useEffect(() => {
    if (!user?.id) return
    fetch(`/api/finance/cash-sessions?status=open&openedBy=${user.id}`)
      .then(r => r.json())
      .then(data => {
        const sessions = data.data || []
        setOpenSessions(sessions)
        if (sessions.length > 0) {
          setForm(f => ({ ...f, cashSessionId: sessions[0].id }))
        }
      })
      .catch(() => {})
  }, [user?.id])

  useEffect(() => {
    fetchExpenses()
  }, [filterCategory])

  async function fetchExpenses() {
    setLoading(true)
    try {
      const url = `/api/finance/expenses?category=${filterCategory}`
      const res = await fetch(url)
      const json = await res.json()
      if (res.ok) {
        setData(json.data)
      }
    } catch (err) {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }

  const totalExpenses = data.reduce((sum, e) => sum + parseFloat(e.amount), 0)

  async function handleAdd() {
    if (!form.description || !form.amount) return
    setSaving(true)
    try {
      const res = await fetch("/api/finance/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          amount: parseFloat(form.amount)
        })
      })
      if (res.ok) {
        toast.success("Dépense enregistrée")
        setOpen(false)
        setForm({ description: "", amount: "", category: "Consommables", cashSessionId: "" })
        fetchExpenses()
      } else {
        const err = await res.json()
        toast.error(err.error || "Erreur lors de l'enregistrement")
      }
    } catch (err) {
      toast.error("Erreur réseau")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-[1200px] mx-auto">
      <PageHeader title="Dépenses Opérationnelles" description="Suivi des charges et décaissements de l'hôpital">
        <div className="flex items-center gap-3">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[180px] h-10 rounded-full border-muted bg-white font-bold text-xs uppercase tracking-widest">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-none shadow-2xl">
              <SelectItem value="all" className="font-bold">Toutes Catégories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
                <Plus className="size-4 mr-2" />Nouvelle Dépense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-white">
              <DialogHeader className="p-8 bg-primary text-primary-foreground">
                <DialogTitle className="text-xl font-black uppercase tracking-tight">Enregistrer une Dépense</DialogTitle>
                <DialogDescription className="text-primary-foreground/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                  Saisissez les détails de la sortie de caisse
                </DialogDescription>
              </DialogHeader>

              <div className="p-8 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</Label>
                  <Input
                    placeholder="Ex: Achat de fournitures de bureau"
                    className="h-12 rounded-2xl border-muted bg-muted/20 font-bold focus-visible:ring-primary"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Montant (FBU)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      className="h-12 rounded-2xl border-muted bg-muted/20 font-bold focus-visible:ring-primary"
                      value={form.amount}
                      onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Catégorie</Label>
                    <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                      <SelectTrigger className="h-12 rounded-2xl border-muted bg-muted/20 font-bold focus:ring-primary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-none shadow-2xl">
                        {categories.map((c) => (
                          <SelectItem key={c} value={c} className="font-bold">{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="pt-2">
                  {openSessions.length > 0 ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center gap-3">
                      <Landmark className="size-5 text-emerald-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Session Active</p>
                        <p className="text-xs font-bold text-emerald-800 truncate">{openSessions[0]?.cashRegister?.name || 'Caisse'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
                      <AlertCircle className="size-5 text-amber-600 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Aucune Session Ouverte</p>
                        <p className="text-[10px] text-amber-600 font-medium">La dépense ne sera pas liée à une session</p>
                      </div>
                    </div>
                  )}
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
                  {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : "Enregistrer"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      {/* KPI Card */}
      <Card className="rounded-[2rem] border-none shadow-sm bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden">
        <CardContent className="p-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Total des Dépenses (Période Actuelle)</p>
            <h2 className="text-3xl font-black tracking-tight">
              {totalExpenses.toLocaleString("fr-FR")}
              <span className="text-xs ml-2 opacity-80 uppercase italic">FBU</span>
            </h2>
          </div>
          <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Badge className="bg-white text-primary rounded-full px-3 font-black text-[10px]">{data.length} Opérations</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-muted/50">
                <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-muted-foreground">Date</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Description</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Catégorie</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground text-right pr-8">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center">
                    <Loader2 className="size-8 animate-spin mx-auto text-primary opacity-20" />
                  </TableCell>
                </TableRow>
              ) : data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-64 text-center text-muted-foreground font-bold italic opacity-30">
                    Aucune dépense enregistrée
                  </TableCell>
                </TableRow>
              ) : (
                data.map((expense) => (
                  <TableRow key={expense.id} className="border-muted/50 hover:bg-white/50 transition-colors">
                    <TableCell className="pl-8 py-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                      {new Date(expense.createdAt).toLocaleDateString("fr-FR")}
                    </TableCell>
                    <TableCell className="font-black text-foreground text-sm uppercase tracking-tight">{expense.description}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-muted/40 border-none px-2 py-0.5">
                        {expense.category}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8 font-black text-sm text-destructive">
                      -{parseFloat(expense.amount).toLocaleString("fr-FR")} FBU
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
