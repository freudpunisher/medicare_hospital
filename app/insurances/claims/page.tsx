"use client"

import React, { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Shield,
  Search,
  Plus,
  FileText,
  CreditCard,
  CheckCircle2,
  Clock,
  ArrowRight,
  Users,
  ClipboardList,
  DollarSign,
  MoreHorizontal,
  Briefcase,
  Printer
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { PageHeader } from "@/components/page-header"
import { BordereauA4 } from "@/components/insurances/bordereau-a4"
import { useRef } from "react"

interface Insurance {
  id: string
  name: string
}

interface PendingInvoice {
  id: string
  invoiceNumber: string
  patient: {
    firstName: string
    lastName: string
    patientNumber: number
  }
  totalAmount: string
  insuranceAmount: string
  patientAmount: string
  createdAt: string
  items: Array<{
    medicalAct: {
      name: string
    }
    quantity: number
    unitPrice: string
  }>
}

interface Batch {
  id: string
  batchNumber: string
  status: string
  totalAmount: string
  createdAt: string
  insurance: { name: string }
  claims: Array<{
    id: string
    claimAmount: string
    invoice: {
      invoiceNumber: string
      insuranceAmount: string
      patient: { firstName: string, lastName: string }
    }
  }>
}

export default function InsuranceClaimsPage() {
  const [insurances, setInsurances] = useState<Insurance[]>([])
  const [selectedInsuranceId, setSelectedInsuranceId] = useState<string>("")
  const [pendingInvoices, setPendingInvoices] = useState<PendingInvoice[]>([])
  const [batches, setBatches] = useState<Batch[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("pending")
  const [printingBatch, setPrintingBatch] = useState<Batch | null>(null)
  const [isSettleOpen, setIsSettleOpen] = useState(false)
  const [settlingBatch, setSettlingBatch] = useState<Batch | null>(null)
  const [paymentDetails, setPaymentDetails] = useState({
    method: 'transfer',
    reference: ''
  })
  const printRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  useEffect(() => {
    fetchInsurances()
  }, [])

  useEffect(() => {
    if (selectedInsuranceId && activeTab === "pending") {
      fetchPendingInvoices()
    }
  }, [selectedInsuranceId, activeTab])

  useEffect(() => {
    if (activeTab === "history") {
      fetchBatches()
    }
  }, [activeTab])

  async function fetchInsurances() {
    try {
      const res = await fetch("/api/insurances/list?active=true")
      const data = await res.json()
      if (res.ok) setInsurances(data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchPendingInvoices() {
    setLoading(true)
    try {
      const res = await fetch(`/api/insurances/claims/pending?insuranceId=${selectedInsuranceId}`)
      const data = await res.json()
      if (res.ok) setPendingInvoices(data.data || [])
    } catch (err) {
      toast.error("Échec du chargement des factures en attente")
    } finally {
      setLoading(false)
    }
  }

  async function fetchBatches() {
    setLoading(true)
    try {
      const res = await fetch("/api/insurances/claims/batches/list")
      const data = await res.json()
      if (res.ok) setBatches(data.data || [])
    } catch (err) {
      toast.error("Échec du chargement de l'historique")
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateBatch(invoiceIds: string[]) {
    if (!selectedInsuranceId) return

    setLoading(true)
    try {
      const res = await fetch("/api/insurances/claims/batches/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ insuranceId: selectedInsuranceId, invoiceIds })
      })
      const data = await res.json()
      if (res.ok) {
        toast.success(`Bordereau ${data.data.batchNumber} créé avec succès`)
        fetchPendingInvoices()
        setActiveTab("history")
      } else {
        toast.error(data.error || "Échec de la création du bordereau")
      }
    } catch (err) {
      toast.error("Erreur réseau")
    } finally {
      setLoading(false)
    }
  }

  async function handleSettleBatch() {
    if (!settlingBatch) return

    // Validate reference for bank/check
    if (['transfer', 'check'].includes(paymentDetails.method) && !paymentDetails.reference) {
      toast.error("Une référence est obligatoire pour les virements et chèques")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/insurances/claims/batches/${settlingBatch.id}/settle`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: settlingBatch.totalAmount,
          paymentMethod: paymentDetails.method,
          referenceNumber: paymentDetails.reference || "SETTLE-" + Date.now().toString().slice(-6)
        })
      })
      if (res.ok) {
        toast.success("Règlement du bordereau enregistré avec succès")
        setIsSettleOpen(false)
        fetchBatches()
      }
    } catch (err) {
      toast.error("Erreur de règlement")
    } finally {
      setLoading(false)
    }
  }

  const handlePrintBordereau = (batch: Batch) => {
    setPrintingBatch(batch)
    setTimeout(() => {
      window.print()
    }, 300)
  }

  return (
    <div className="relative min-h-screen">
      {/* Main UI - Hidden during printing */}
      <div className="p-6 space-y-6 max-w-[1600px] mx-auto print:hidden">
        <PageHeader title="Gestion des Bordereaux" description="Facturation institutionnelle et regroupement des claims">
          <div className="flex items-center gap-3">
            <Select value={selectedInsuranceId} onValueChange={setSelectedInsuranceId}>
              <SelectTrigger className="w-[200px] bg-background shadow-sm border-muted/50 rounded-xl font-bold">
                <SelectValue placeholder="Choisir une assurance" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-muted/50 shadow-2xl">
                {insurances.map(ins => (
                  <SelectItem key={ins.id} value={ins.id} className="font-medium focus:bg-primary/5">
                    {ins.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </PageHeader>

        <Tabs defaultValue="pending" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="bg-muted/50 p-1 rounded-2xl mb-8 w-fit border border-muted/30 font-sans">
            <TabsTrigger value="pending" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest transition-all">
              <Clock className="size-4 mr-2 text-orange-500" />
              Prêts à Bordereau
            </TabsTrigger>
            <TabsTrigger value="history" className="rounded-xl px-8 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-md font-black text-[10px] uppercase tracking-widest transition-all">
              <CheckCircle2 className="size-4 mr-2 text-green-500" />
              Historique Batches
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {!selectedInsuranceId ? (
              <Card className="rounded-[2.5rem] border-none shadow-sm bg-muted/20 p-20 text-center">
                <div className="mx-auto size-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 border-2 border-dashed border-primary/30">
                  <Shield className="size-10 text-primary opacity-50" />
                </div>
                <h3 className="text-xl font-black text-foreground mb-2">Sélectionnez une compagnie d'assurance</h3>
                <p className="text-muted-foreground text-sm max-w-xs mx-auto font-medium">Choisissez un partenaire pour regrouper les factures patients en un seul bordereau.</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                <div className="lg:col-span-3">
                  <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-xl font-black flex items-center gap-2">
                            Dossiers Individuels ({pendingInvoices.length})
                          </CardTitle>
                          <CardDescription className="font-bold text-primary text-[10px] uppercase tracking-widest">Ces factures ne sont liées à aucun bordereau</CardDescription>
                        </div>
                        <Button
                          className="rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
                          disabled={pendingInvoices.length === 0 || loading}
                          onClick={() => handleCreateBatch(pendingInvoices.map(i => i.id))}
                        >
                          Générer Bordereau (Total)
                          <ArrowRight className="size-4 ml-2" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="p-0">
                      {pendingInvoices.length === 0 ? (
                        <div className="p-20 text-center text-muted-foreground italic font-medium">Toutes les factures de cet assureur sont déjà traitées.</div>
                      ) : (
                        <Table>
                          <TableHeader className="bg-primary/5">
                            <TableRow className="border-muted/50 font-sans">
                              <TableHead className="pl-8 font-black text-[10px] uppercase tracking-tighter text-muted-foreground">Patient & Détails Actes</TableHead>
                              <TableHead className="font-black text-[10px] uppercase tracking-tighter text-muted-foreground">Dû Assurance</TableHead>
                              <TableHead className="font-black text-[10px] uppercase tracking-tighter text-muted-foreground">Status Actuel</TableHead>
                              <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-tighter text-muted-foreground">Ajouter</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingInvoices.map((inv) => (
                              <TableRow key={inv.id} className="group hover:bg-primary/5 transition-colors border-muted/50">
                                <TableCell className="pl-8 py-5">
                                  <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-black text-sm text-foreground">{inv.patient.firstName} {inv.patient.lastName}</p>
                                      <Badge variant="outline" className="text-[9px] font-black bg-muted/40 border-none px-1.5 py-0">#{inv.patient.patientNumber}</Badge>
                                      <span className="text-[10px] text-muted-foreground italic">({inv.invoiceNumber})</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1">
                                      {inv.items?.map((item, idx) => (
                                        <span key={idx} className="text-[10px] text-muted-foreground font-bold bg-muted/30 px-1.5 py-0.5 rounded-md">
                                          {item.medicalAct?.name || "Acte inconnu"}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <p className="text-[14px] font-black text-primary">{parseInt(inv.insuranceAmount).toLocaleString()} FBU</p>
                                  <p className="text-[9px] font-bold text-muted-foreground uppercase opacity-60">Attente règlement</p>
                                </TableCell>
                                <TableCell>
                                  <Badge className="bg-orange-500/10 text-orange-600 border-none text-[9px] font-black uppercase">Isolé</Badge>
                                </TableCell>
                                <TableCell className="text-right pr-8">
                                  <Button variant="ghost" size="icon" className="rounded-full size-8 opacity-0 group-hover:opacity-100 transition-all hover:bg-primary/10 hover:text-primary" onClick={() => handleCreateBatch([inv.id])}>
                                    <Plus className="size-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </CardContent>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="rounded-[2.5rem] border-none shadow-sm bg-gradient-to-br from-primary to-primary/80 text-primary-foreground overflow-hidden font-sans">
                    <CardContent className="p-8 space-y-6 relative">
                      <div className="absolute -top-10 -right-10 size-40 bg-white/10 rounded-full blur-3xl" />
                      <div className="size-12 rounded-2xl bg-white/20 flex items-center justify-center">
                        <Briefcase className="size-6" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-1">Montant Bordereau (Total)</p>
                        <h2 className="text-4xl font-black tracking-tight leading-none">
                          {pendingInvoices.reduce((acc, inv) => acc + parseInt(inv.insuranceAmount), 0).toLocaleString()}
                          <span className="text-xs ml-2 opacity-80 uppercase tracking-tighter">FBU</span>
                        </h2>
                      </div>
                      <p className="text-[11px] font-medium leading-relaxed opacity-90 italic">
                        "Le regroupement permet d'envoyer une seule demande de paiement globale à {insurances.find(i => i.id === selectedInsuranceId)?.name}."
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[2.5rem] border-none shadow-sm bg-card/60 backdrop-blur-xl font-sans">
                    <CardHeader>
                      <CardTitle className="text-xs font-black uppercase tracking-widest text-primary">Regles d'Or</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex gap-4">
                        <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px] shrink-0 italic">1</div>
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">Une facture ne peut appartenir qu'à **un seul bordereau**.</p>
                      </div>
                      <div className="flex gap-4">
                        <div className="size-6 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[10px] shrink-0 italic">2</div>
                        <p className="text-xs text-muted-foreground leading-relaxed font-medium">Le paiement s'effectue sur le **bordereau complet**.</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="history" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
              <CardHeader className="pb-4">
                <div className="flex items-end justify-between">
                  <div>
                    <CardTitle className="text-xl font-black">Historique des Bordereaux (Batches)</CardTitle>
                    <CardDescription className="font-bold text-foreground text-[10px] uppercase tracking-widest">Suivi des réclamations groupées</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {batches.length === 0 ? (
                  <div className="p-20 text-center text-muted-foreground italic font-medium">Aucun bordereau historique disponible.</div>
                ) : (
                  <Table>
                    <TableHeader className="bg-muted/30">
                      <TableRow className="border-muted/50 hover:bg-transparent font-sans">
                        <TableHead className="pl-8 font-black text-[10px] uppercase tracking-tighter text-muted-foreground">Numéro Bordereau</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-tighter text-muted-foreground">Assureur</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-tighter text-muted-foreground">Nombre de Factures</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-tighter text-muted-foreground">Montant Total</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-tighter text-muted-foreground">Statut</TableHead>
                        <TableHead className="font-black text-[10px] uppercase tracking-tighter text-muted-foreground text-right pr-8">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {batches.map((batch) => (
                        <TableRow key={batch.id} className="group hover:bg-primary/5 transition-colors border-muted/50">
                          <TableCell className="pl-8 py-5">
                            <div>
                              <p className="font-black text-sm text-foreground uppercase tracking-widest">{batch.batchNumber}</p>
                              <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 italic">Créé le {new Date(batch.createdAt).toLocaleDateString('fr-FR')}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className="bg-primary/10 text-primary border-none text-[9px] font-black uppercase tracking-tighter">{batch.insurance.name}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1.5 font-bold text-xs text-muted-foreground">
                              <Users className="size-3.5 opacity-60" />
                              {batch.claims?.length || 0} Factures
                            </div>
                          </TableCell>
                          <TableCell>
                            <p className="text-[14px] font-black text-foreground">{parseInt(batch.totalAmount).toLocaleString()} FBU</p>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "rounded-full px-3 py-1 border-none text-[10px] font-black uppercase flex items-center w-fit gap-1",
                              batch.status === 'paid' ? "bg-green-500/10 text-green-600" : "bg-orange-500/10 text-orange-600"
                            )}>
                              {batch.status === 'paid' ? <CheckCircle2 className="size-3" /> : <Clock className="size-3" />}
                              {batch.status === 'paid' ? 'Soldé' : 'En Attente'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8">
                            <div className="flex items-center justify-end gap-2">
                              {batch.status === 'pending' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-full font-black text-[10px] uppercase tracking-widest border-primary/20 hover:bg-primary/10 hover:text-primary transition-all shadow-lg shadow-primary/5"
                                  onClick={() => {
                                    setSettlingBatch(batch)
                                    setIsSettleOpen(true)
                                  }}
                                  disabled={loading}
                                >
                                  Solder
                                </Button>
                              )}

                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="rounded-full size-8">
                                    <MoreHorizontal className="size-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="rounded-2xl w-48 shadow-2xl border-none">
                                  <DropdownMenuLabel className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Options</DropdownMenuLabel>
                                  <DropdownMenuItem className="rounded-xl gap-2 font-bold cursor-pointer" onClick={() => handlePrintBordereau(batch)}>
                                    <Printer className="size-4" /> Imprimer Bordereau
                                  </DropdownMenuItem>
                                  <DropdownMenuItem className="rounded-xl gap-2 font-bold cursor-pointer" onClick={() => router.push(`/insurances/claims/batches/${batch.id}`)}>
                                    <ClipboardList className="size-4" /> Voir Détails
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Settle Modal */}
      <Dialog open={isSettleOpen} onOpenChange={setIsSettleOpen}>
        <DialogContent className="max-w-md rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden bg-card/95 backdrop-blur-2xl">
          <DialogHeader className="p-8 bg-primary text-primary-foreground">
            <DialogTitle className="text-xl font-black uppercase tracking-tight">Règlement du Bordereau</DialogTitle>
            <DialogDescription className="text-primary-foreground/70 font-bold text-[10px] uppercase tracking-widest mt-1">
              Confirmation de l'encaissement des fonds
            </DialogDescription>
          </DialogHeader>

          <div className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Mode de Paiement</Label>
                <Select
                  value={paymentDetails.method}
                  onValueChange={(v) => setPaymentDetails(prev => ({ ...prev, method: v }))}
                >
                  <SelectTrigger className="h-12 rounded-2xl border-muted bg-muted/20 font-bold focus:ring-primary">
                    <SelectValue placeholder="Choisir un mode" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-2xl">
                    <SelectItem value="transfer" className="rounded-xl font-bold">Virement Bancaire</SelectItem>
                    <SelectItem value="check" className="rounded-xl font-bold">Chèque</SelectItem>
                    <SelectItem value="cash" className="rounded-xl font-bold">Espèces</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {['transfer', 'check'].includes(paymentDetails.method) && (
                <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Référence du Paiement</Label>
                  <Input
                    placeholder={paymentDetails.method === 'transfer' ? "Ex: VIR-2024-001" : "Ex: CHQ-550123"}
                    className="h-12 rounded-2xl border-muted bg-muted/20 font-bold focus-visible:ring-primary"
                    value={paymentDetails.reference}
                    onChange={(e) => setPaymentDetails(prev => ({ ...prev, reference: e.target.value }))}
                  />
                </div>
              )}
            </div>

            {settlingBatch && (
              <div className="bg-primary/5 p-4 rounded-2xl border border-primary/20 space-y-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">Montant à Encaisser ({settlingBatch.batchNumber})</p>
                <p className="text-2xl font-black text-primary">
                  {parseInt(settlingBatch.totalAmount).toLocaleString()} <span className="text-xs font-normal">FBU</span>
                </p>
              </div>
            )}
          </div>

          <DialogFooter className="p-6 bg-muted/30 border-t border-muted/50 gap-3">
            <Button variant="ghost" className="rounded-full font-black uppercase text-[10px] tracking-widest" onClick={() => setIsSettleOpen(false)}>
              Annuler
            </Button>
            <Button
              className="rounded-full font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20"
              onClick={handleSettleBatch}
              disabled={loading}
            >
              {loading ? "Traitement..." : "Confirmer le Règlement"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Off-screen A4 container for printing */}
      <div className="hidden print:block bg-white relative">
        <BordereauA4 batch={printingBatch} ref={printRef} />
      </div>
    </div>
  )
}