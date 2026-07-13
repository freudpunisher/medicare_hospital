"use client"

import { useState, useEffect } from "react"
import { Plus, Clock, CheckCircle2, Loader2, AlertCircle, Calculator, Wallet, Check } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface Session {
  id: string
  cashRegisterId: string
  openedBy: string
  closedBy: string | null
  openedAt: string
  closedAt: string | null
  openingBalance: string
  closingBalance: string | null
  totalIncome: string
  expectedBalance: string
  physicalBalance: string | null
  status: "open" | "closed"
  notes: string | null
  cashRegister?: { name: string }
}

interface Register {
  id: string
  name: string
  isActive: boolean
}

export default function CashSessionsPage() {
  const [data, setData] = useState<Session[]>([])
  const [registers, setRegisters] = useState<Register[]>([])
  const [loading, setLoading] = useState(true)
  const [openModal, setOpenModal] = useState(false)
  const [closeModal, setCloseModal] = useState(false)
  const [selectedSession, setSelectedSession] = useState<Session | null>(null)
  const [saving, setSaving] = useState(false)

  const [openForm, setOpenForm] = useState({
    cashRegisterId: "",
    openingBalance: 0,
  })

  const [closeForm, setCloseForm] = useState({
    physicalBalance: 0,
    notes: ""
  })

  const [expectedData, setExpectedData] = useState<{
    openingBalance: number
    pharmacyRevenue: number
    actsRevenue: number
    totalExpenses: number
    expectedIncome: number
    expectedBalance: number
  } | null>(null)
  const [loadingExpected, setLoadingExpected] = useState(false)

  useEffect(() => {
    if (closeModal && selectedSession) {
      fetchExpected(selectedSession.id)
    } else {
      setExpectedData(null)
    }
  }, [closeModal, selectedSession])

  async function fetchExpected(sessionId: string) {
    setLoadingExpected(true)
    try {
      const res = await fetch(`/api/finance/cash-sessions/${sessionId}/expected`)
      const json = await res.json()
      if (res.ok) {
        setExpectedData(json.data)
      }
    } catch (err) {
      toast.error("Erreur de calcul des recettes")
    } finally {
      setLoadingExpected(false)
    }
  }

  const difference = expectedData ? closeForm.physicalBalance - expectedData.expectedBalance : 0

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [sessRes, regRes] = await Promise.all([
        fetch("/api/finance/cash-sessions"),
        fetch("/api/finance/cash-registers")
      ])
      const sessJson = await sessRes.json()
      const regJson = await regRes.json()
      if (sessRes.ok) setData(sessJson.data)
      if (regRes.ok) setRegisters(regJson.data)
    } catch (err) {
      toast.error("Erreur de chargement")
    } finally {
      setLoading(false)
    }
  }

  async function handleOpenSession() {
    if (!openForm.cashRegisterId) return
    setSaving(true)
    try {
      const userRes = await fetch("/api/auth/me")
      const userJson = await userRes.json()
      const userId = userJson.data.id

      // Check if user already has an open session
      const existingRes = await fetch(`/api/finance/cash-sessions?status=open&openedBy=${userId}`)
      const existingJson = await existingRes.json()
      const existing = existingJson.data || []
      if (existing.length > 0) {
        toast.error("Vous avez déjà une session ouverte. Veuillez la fermer avant d'en ouvrir une nouvelle.")
        setSaving(false)
        return
      }

      const res = await fetch("/api/finance/cash-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "open",
          data: {
            cashRegisterId: openForm.cashRegisterId,
            openingBalance: openForm.openingBalance,
            openedBy: userId
          }
        })
      })
      if (res.ok) {
        toast.success("Session ouverte")
        setOpenModal(false)
        fetchData()
      }
    } catch (err) {
      toast.error("Erreur réseau")
    } finally {
      setSaving(false)
    }
  }

  async function handleCloseSession() {
    if (!selectedSession) return
    setSaving(true)
    try {
      const userRes = await fetch("/api/auth/me")
      const userJson = await userRes.json()
      const userId = userJson.data.id

      const res = await fetch("/api/finance/cash-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "close",
          data: {
            id: selectedSession.id,
            physicalBalance: closeForm.physicalBalance,
            closedBy: userId,
            notes: closeForm.notes
          }
        })
      })
      if (res.ok) {
        toast.success("Session clôturée avec succès")
        setCloseModal(false)
        fetchData()
      }
    } catch (err) {
      toast.error("Erreur")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-8 max-w-[1400px] mx-auto">
      <PageHeader title="Sessions de Caisse" description="Suivi des ouvertures, fermetures et rapprochements de trésorerie">
        <Dialog open={openModal} onOpenChange={setOpenModal}>
          <DialogTrigger asChild>
            <Button className="rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
              <Plus className="size-4 mr-2" />Ouvrir une Session
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md rounded-[2.5rem] border-none shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 bg-emerald-600 text-white">
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Ouverture de Session</DialogTitle>
              <DialogDescription className="text-emerald-100 font-bold text-[10px] uppercase tracking-widest mt-1">Initialisez le fond de caisse pour démarrer</DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Sélectionner la Caisse</Label>
                <Select value={openForm.cashRegisterId} onValueChange={(v) => setOpenForm((f) => ({ ...f, cashRegisterId: v }))}>
                  <SelectTrigger className="h-12 rounded-2xl border-muted bg-muted/20 font-bold focus:ring-primary">
                    <SelectValue placeholder="Choisir une caisse" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    {registers.filter(r => r.isActive).map((r) => (
                      <SelectItem key={r.id} value={r.id} className="font-bold">{r.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Fond de Caisse Initial (FBU)</Label>
                <div className="relative">
                  <Input
                    type="number"
                    className="h-12 rounded-2xl border-muted bg-muted/20 font-black text-xl focus-visible:ring-emerald-500"
                    value={openForm.openingBalance}
                    onChange={(e) => setOpenForm((f) => ({ ...f, openingBalance: parseFloat(e.target.value) || 0 }))}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black opacity-30 italic">FBU</div>
                </div>
              </div>
            </div>
            <DialogFooter className="p-6 bg-muted/30 border-t border-muted/50 gap-3">
              <Button variant="ghost" className="rounded-full font-black uppercase text-[10px] tracking-widest" onClick={() => setOpenModal(false)}>Annuler</Button>
              <Button className="rounded-full font-black uppercase text-[10px] tracking-widest bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl shadow-emerald-500/20" onClick={handleOpenSession} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : "Confirmer l'Ouverture"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-white/50 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-muted/50">
                <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-muted-foreground">Terminal / Caisse</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Ouverture</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Fermeture</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Fond Initial</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Recettes Sys.</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Statut</TableHead>
                <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-muted-foreground">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="h-64 text-center"><Loader2 className="size-8 animate-spin mx-auto text-primary opacity-20" /></TableCell></TableRow>
              ) : data.map((session) => (
                <TableRow key={session.id} className="border-muted/50 hover:bg-white/50 transition-colors py-4">
                  <TableCell className="pl-8">
                    <div className="flex flex-col">
                      <span className="font-black text-sm uppercase tracking-tight text-foreground">{session.cashRegister?.name || "Caisse Inconnue"}</span>
                      <span className="text-[9px] text-muted-foreground font-bold">ID: {session.id.split('-')[0]}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-slate-600">{new Date(session.openedAt).toLocaleDateString()}</span>
                      <span className="text-[10px] font-black text-slate-400">{new Date(session.openedAt).toLocaleTimeString()}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {session.closedAt ? (
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-600">{new Date(session.closedAt).toLocaleDateString()}</span>
                        <span className="text-[10px] font-black text-slate-400">{new Date(session.closedAt).toLocaleTimeString()}</span>
                      </div>
                    ) : <span className="text-[10px] font-black text-muted-foreground opacity-30 italic">En cours...</span>}
                  </TableCell>
                  <TableCell className="font-black text-xs text-slate-700">{parseFloat(session.openingBalance).toLocaleString()} FBU</TableCell>
                  <TableCell className="font-black text-xs text-emerald-600">
                    {session.status === 'closed' ? `+${parseFloat(session.totalIncome).toLocaleString()} FBU` : "-"}
                  </TableCell>
                  <TableCell>
                    {session.status === "open" ? (
                      <Badge variant="outline" className="rounded-lg border-emerald-500/20 bg-emerald-500/10 text-emerald-600 text-[9px] font-black uppercase tracking-widest">OUVERTE</Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-lg border-slate-300 bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest">CLÔTURÉE</Badge>
                    )}
                  </TableCell>
                  <TableCell className="pr-8 text-right">
                    {session.status === "open" && (
                      <Button
                        size="sm"
                        className="rounded-full h-8 px-4 font-black uppercase text-[9px] tracking-widest bg-slate-900 hover:bg-black text-white"
                        onClick={() => {
                          setSelectedSession(session)
                          setCloseModal(true)
                        }}
                      >
                        Fermer
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Professional Reconciliation Modal */}
      <Dialog open={closeModal} onOpenChange={setCloseModal}>
        <DialogContent className="max-w-2xl rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-slate-50">
          <DialogHeader className="p-10 bg-slate-900 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 p-10 opacity-10">
              <Calculator className="size-32" />
            </div>
            <DialogTitle className="text-2xl font-black uppercase tracking-tight">Rapprochement de Caisse</DialogTitle>
            <DialogDescription className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 flex items-center gap-2">
              <Clock className="size-4" /> Clôture de la session du {selectedSession && new Date(selectedSession.openedAt).toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>

          <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Récapitulatif Système</h4>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 rounded-2xl bg-white border border-slate-200">
                  <span className="text-[10px] font-black uppercase text-slate-500">Fond Initial</span>
                  <span className="font-black text-slate-900">{expectedData?.openingBalance.toLocaleString() || "..."} FBU</span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-2xl bg-white border border-slate-200">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-emerald-600">Recettes Enregistrées</span>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Pharmacie + Actes</span>
                  </div>
                  <span className="font-black text-emerald-600">
                    {loadingExpected ? <Loader2 className="size-4 animate-spin" /> : `+${expectedData?.expectedIncome.toLocaleString() || "0"} FBU`}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 rounded-2xl bg-white border border-rose-200">
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-rose-600">Dépenses</span>
                    <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Charges de la session</span>
                  </div>
                  <span className="font-black text-rose-600">
                    {loadingExpected ? <Loader2 className="size-4 animate-spin" /> : `-${expectedData?.totalExpenses.toLocaleString() || "0"} FBU`}
                  </span>
                </div>
                <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl shadow-slate-900/10">
                  <p className="text-[9px] font-black uppercase tracking-widest opacity-50 mb-1 text-center">Solde Final Attendu</p>
                  <p className="text-3xl font-black text-center tracking-tighter">
                    {loadingExpected ? "..." : `${expectedData?.expectedBalance.toLocaleString() || "0"} FBU`}
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Vérification Physique</h4>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Montant Réel en Caisse (Espèces)</Label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                    <Wallet className="size-5" />
                  </div>
                  <Input
                    type="number"
                    className="h-16 pl-12 rounded-2xl border-2 border-slate-200 bg-white font-black text-2xl focus-visible:ring-primary focus-visible:border-primary shadow-inner"
                    value={closeForm.physicalBalance}
                    onChange={(e) => setCloseForm((f) => ({ ...f, physicalBalance: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Notes de Clôture (Facultatif)</Label>
                <Textarea
                  className="rounded-2xl border-slate-200 bg-white font-bold text-xs"
                  placeholder="Observations au sujet des écarts..."
                  value={closeForm.notes}
                  onChange={(e) => setCloseForm((f) => ({ ...f, notes: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="p-8 bg-white border-t border-slate-200 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className={cn(
              "flex items-center gap-3 px-4 py-2 rounded-full border",
              difference === 0 ? "bg-emerald-50 border-emerald-100 text-emerald-600" : "bg-rose-50 border-rose-100 text-rose-600"
            )}>
              {difference === 0 ? <Check className="size-4" /> : <AlertCircle className="size-4" />}
              <span className="text-[10px] font-black uppercase tracking-widest italic">
                {difference === 0 ? "Caisse Équilibrée" : `Écart: ${difference.toLocaleString()} FBU`}
              </span>
            </div>
            <div className="flex gap-3">
              <Button variant="ghost" className="rounded-full font-black uppercase text-[10px] tracking-widest h-12 px-6" onClick={() => setCloseModal(false)}>
                Annuler
              </Button>
              <Button
                className="rounded-full font-black uppercase text-[10px] tracking-widest h-12 px-8 bg-slate-900 hover:bg-black text-white shadow-2xl"
                onClick={handleCloseSession}
                disabled={saving || loadingExpected}
              >
                {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : "Valider la Clôture"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
