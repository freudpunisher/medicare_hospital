"use client"

import { useState, useMemo, useEffect, useRef } from "react"
import { Search, Plus, Trash2, User, Shield, ShieldOff, Check, Loader2, Printer, CreditCard, Banknote, Smartphone } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"

interface Act {
  id: string
  code: string
  name: string
  serviceId: string
  basePrice: string
  isActive: boolean
}

interface Patient {
  id: string
  firstName: string
  lastName: string
  phone: string
  isInsured: boolean
  insuranceId: string | null
  insuranceNumber: string | null
  insuranceExpiryDate: string | null
  insuranceCardNumber: string | null
  coverageRate: string
  gender: string
  dateOfBirth: string
}

interface InsuranceRule {
  id: string
  insuranceId: string
  serviceId: string
  coverageRate: string
  plafond: string | null
}

interface Service {
  id: string
  name: string
  isActive: boolean
}

interface InvoiceItem {
  id: string
  actId: string
  actName: string
  actCode: string
  quantity: number
  unitPrice: number
  insurancePart: number
  patientPart: number
  totalPrice: number
}

export default function BillingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [acts, setActs] = useState<Act[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [insuranceRules, setInsuranceRules] = useState<InsuranceRule[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [selectedServiceId, setSelectedServiceId] = useState<string>("all")
  const [selectedActId, setSelectedActId] = useState<string>("")
  const [showSearch, setShowSearch] = useState(false)
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [loadingActs, setLoadingActs] = useState(false)
  const [loadingServices, setLoadingServices] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // New: Payment Method and Printing
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile_money" | "card">("cash")
  const [paymentReference, setPaymentReference] = useState("")
  const [lastInvoice, setLastInvoice] = useState<any>(null)
  const printRef = useRef<HTMLDivElement>(null)

  // Fetch acts and services on mount
  useEffect(() => {
    async function fetchInitialData() {
      setLoadingActs(true)
      setLoadingServices(true)
      try {
        const [actsRes, servicesRes] = await Promise.all([
          fetch("/api/acts/list"),
          fetch("/api/services/list?active=true")
        ])
        const actsData = await actsRes.json()
        const servicesData = await servicesRes.json()

        if (actsRes.ok) setActs(actsData.data || [])
        if (servicesRes.ok) setServices(servicesData.data || [])
      } catch (err) {
        console.error("Failed to fetch initial data")
      } finally {
        setLoadingActs(false)
        setLoadingServices(false)
      }
    }
    fetchInitialData()
  }, [])

  // Search patients
  useEffect(() => {
    const handler = setTimeout(async () => {
      if (searchQuery.length > 1) {
        setLoadingPatients(true)
        try {
          const res = await fetch(`/api/patients/list?search=${encodeURIComponent(searchQuery)}`)
          const data = await res.json()
          if (res.ok) setPatients(data.data || [])
        } catch (err) {
          console.error("Failed to search patients")
        } finally {
          setLoadingPatients(false)
        }
      } else {
        setPatients([])
      }
    }, 300)

    return () => clearTimeout(handler)
  }, [searchQuery])

  // Fetch insurance rules when patient selected
  useEffect(() => {
    async function fetchRules() {
      if (selectedPatient?.isInsured && selectedPatient.insuranceId) {
        try {
          const res = await fetch(`/api/insurances/rules?insuranceId=${selectedPatient.insuranceId}`)
          const data = await res.json()
          if (res.ok) setInsuranceRules(data.data || [])
        } catch (err) {
          console.error("Failed to fetch rules")
        }
      } else {
        setInsuranceRules([])
      }
    }
    fetchRules()
  }, [selectedPatient])

  const filteredActs = useMemo(() => {
    if (selectedServiceId === "all") return acts.filter(a => a.isActive)
    return acts.filter(a => a.isActive && a.serviceId === selectedServiceId)
  }, [acts, selectedServiceId])

  const totals = useMemo(() => {
    const total = items.reduce((sum, i) => sum + i.totalPrice, 0)
    const insTotal = items.reduce((sum, i) => sum + i.insurancePart, 0)
    const patTotal = items.reduce((sum, i) => sum + i.patientPart, 0)
    return { total, insTotal, patTotal }
  }, [items])

  function calculateCoverage(act: Act, qty: number): { insurancePart: number; patientPart: number } {
    const unitPrice = parseFloat(act.basePrice)
    const total = unitPrice * qty

    if (!selectedPatient?.isInsured || !selectedPatient.insuranceId) {
      return { insurancePart: 0, patientPart: total }
    }

    const rule = insuranceRules.find((r) => r.serviceId === act.serviceId)

    // Use rule coverageRate, or fallback to patient global coverageRate
    const rawRate = rule ? rule.coverageRate : selectedPatient.coverageRate
    const rate = parseFloat(rawRate) / 100

    let covered = total * rate

    if (rule && rule.plafond) {
      const plafond = parseFloat(rule.plafond)
      if (covered > plafond) covered = plafond
    }

    return {
      insurancePart: Math.round(covered),
      patientPart: total - Math.round(covered)
    }
  }

  function addItem() {
    if (!selectedActId || !selectedPatient) return
    const act = acts.find((a) => a.id === selectedActId)
    if (!act) return

    const { insurancePart, patientPart } = calculateCoverage(act, 1)

    setItems((prev) => [
      ...prev,
      {
        id: `ii-${Date.now()}`,
        actId: act.id,
        actName: act.name,
        actCode: act.code,
        quantity: 1,
        unitPrice: parseFloat(act.basePrice),
        insurancePart,
        patientPart,
        totalPrice: parseFloat(act.basePrice),
      },
    ])
    setSelectedActId("")
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  async function handleValidate() {
    if (items.length === 0 || !selectedPatient) return
    setIsSubmitting(true)
    try {
      const payload = {
        patientId: selectedPatient.id,
        totalAmount: totals.total,
        insuranceAmount: totals.insTotal,
        patientAmount: totals.patTotal,
        paymentMethod,
        paymentReference: paymentMethod === 'mobile_money' ? paymentReference : null,
        items: items.map(i => ({
          actId: i.actId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
        }))
      }

      const res = await fetch("/api/billing/invoices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })

      const resData = await res.json()
      if (!res.ok) {
        toast.error(resData.error || "Échec de la validation de la facture")
        return
      }

      setLastInvoice({
        ...resData.data,
        patient: selectedPatient,
        items: items,
        paymentMethod,
        paymentReference
      })

      toast.success("Facture validée et paiement enregistré", {
        description: `Total: ${totals.total.toLocaleString()} FBU | Patient: ${totals.patTotal.toLocaleString()} FBU`,
      })

      // Prompt to print
      setTimeout(() => {
        if (confirm("Voulez-vous imprimer le reçu ?")) {
          window.print()
        }
        setItems([])
        setSelectedPatient(null)
        setSearchQuery("")
        setPaymentReference("")
      }, 500)

    } catch (err) {
      toast.error("Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #thermal-receipt, #thermal-receipt * {
            visibility: visible;
          }
          #thermal-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 80mm;
            padding: 5mm;
            background: white;
            color: black;
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
          }
          @page {
            size: 80mm auto;
            margin: 0;
          }
        }
      `}</style>

      <PageHeader title="Facturation" description="Gérer les factures et les paiements immédiats" />

      {/* Hidden Thermal Receipt for Printing */}
      <div id="thermal-receipt" className="hidden">
        {lastInvoice && (
          <div className="flex flex-col items-center">
            <h2 className="text-xl font-bold uppercase tracking-tighter">MEDICARE HOSPITAL</h2>
            <p className="text-[10px] mb-2 font-mono">Service Médical de Qualité</p>
            <div className="w-full border-t border-dashed border-black my-2" />

            <div className="w-full space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span>DATE:</span>
                <span>{new Date(lastInvoice.createdAt).toLocaleString('fr-FR')}</span>
              </div>
              <div className="flex justify-between">
                <span>FACT NO:</span>
                <span>{lastInvoice.invoiceNumber}</span>
              </div>
              <div className="flex justify-between">
                <span>PATIENT:</span>
                <span className="uppercase text-right">{lastInvoice.patient.firstName} {lastInvoice.patient.lastName}</span>
              </div>
              {lastInvoice.patient.insuranceNumber && (
                <div className="flex justify-between">
                  <span>MATRICULE:</span>
                  <span>{lastInvoice.patient.insuranceNumber}</span>
                </div>
              )}
            </div>

            <div className="w-full border-t border-dashed border-black my-2" />

            <table className="w-full text-left font-mono text-[11px]">
              <thead>
                <tr className="border-b border-black">
                  <th className="font-bold">ITEM</th>
                  <th className="text-right font-bold">PRIX</th>
                </tr>
              </thead>
              <tbody>
                {lastInvoice.items.map((item: any) => (
                  <tr key={item.id}>
                    <td className="py-1">
                      {item.actName}
                      <br />
                      <span className="text-[9px] italic">{item.actCode}</span>
                    </td>
                    <td className="text-right">{item.patientPart.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="w-full border-t border-dashed border-black my-2" />

            <div className="w-full space-y-1 font-mono text-[11px]">
              <div className="flex justify-between font-bold">
                <span>TOTAL BRUT:</span>
                <span>{totals.total.toLocaleString()} FBU</span>
              </div>
              <div className="flex justify-between">
                <span>PART ASSUREANCE:</span>
                <span>-{totals.insTotal.toLocaleString()} FBU</span>
              </div>
              <div className="flex justify-between text-base font-black">
                <span>À PAYER:</span>
                <span>{totals.patTotal.toLocaleString()} FBU</span>
              </div>
              <div className="w-full border-t border-black my-1" />
              <div className="flex justify-between capitalize">
                <span>MODE:</span>
                <span>{lastInvoice.paymentMethod.replace('_', ' ')}</span>
              </div>
              {lastInvoice.paymentReference && (
                <div className="flex justify-between">
                  <span>REF:</span>
                  <span>{lastInvoice.paymentReference}</span>
                </div>
              )}
            </div>

            <div className="w-full border-t border-dashed border-black my-4" />
            <p className="text-center text-[10px] italic">*** Merci pour votre confiance ***</p>
            <p className="text-center text-[8px] mt-1 font-mono">{lastInvoice.id}</p>
          </div>
        )}
      </div>

      {/* Patient Search */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un patient par nom ou téléphone..."
              className="pl-10 h-12 text-base border-primary/20 focus-visible:ring-primary"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearch(true)
              }}
              onFocus={() => setShowSearch(true)}
            />
            {showSearch && (searchQuery || loadingPatients) && (
              <div className="absolute top-full left-0 right-0 z-50 mt-2 rounded-xl border bg-card shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                {loadingPatients ? (
                  <div className="flex items-center gap-2 p-4 text-sm text-muted-foreground">
                    <Loader2 className="size-4 animate-spin" />
                    Recherche en cours...
                  </div>
                ) : patients.length > 0 ? (
                  <div className="max-h-80 overflow-y-auto p-1">
                    {patients.map((patient) => (
                      <button
                        key={patient.id}
                        className="flex w-full items-center gap-3 px-3 py-3 rounded-lg hover:bg-primary/10 transition-colors text-left"
                        onMouseDown={() => {
                          setSelectedPatient(patient)
                          setSearchQuery("")
                          setShowSearch(false)
                          setItems([])
                        }}
                      >
                        <div className="bg-primary/10 p-2 rounded-full">
                          <User className="size-4 text-primary" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground">
                            {patient.firstName} {patient.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{patient.phone}</p>
                        </div>
                        {patient.isInsured && (
                          <Badge variant="outline" className="ml-auto border-green-500/30 bg-green-500/5 text-green-600 text-[10px] h-5">
                            <Shield className="size-3 mr-1" />
                            Assuré
                          </Badge>
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="p-4 text-sm text-muted-foreground text-center italic">Aucun patient trouvé</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPatient ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Patient & Add Acts */}
          <div className="lg:col-span-4 space-y-6">
            <Card className="overflow-hidden">
              <CardHeader className="bg-muted/50 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-bold">Informations Patient</CardTitle>
                  <Button variant="ghost" size="sm" className="h-8 text-xs underline" onClick={() => setSelectedPatient(null)}>Changer</Button>
                </div>
              </CardHeader>
              <CardContent className="pt-4 space-y-4">
                <div className="flex items-center gap-4">
                  <div className="bg-primary/10 p-3 rounded-xl">
                    <User className="size-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-xl font-bold text-foreground leading-tight">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{selectedPatient.phone}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/50 p-2 rounded-md">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Genre</p>
                    <p className="font-medium capitalize">{selectedPatient.gender === 'male' ? 'Homme' : 'Femme'}</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded-md">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Âge</p>
                    <p className="font-medium">{new Date().getFullYear() - new Date(selectedPatient.dateOfBirth).getFullYear()} ans</p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  {selectedPatient.isInsured ? (
                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3 space-y-2">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="size-4 text-green-600" />
                        <span className="text-sm font-bold text-green-600">Patient Assuré</span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5 text-[11px]">
                        <p className="text-muted-foreground">
                          Matricule: <span className="font-bold text-foreground">{selectedPatient.insuranceNumber}</span>
                        </p>
                        {selectedPatient.insuranceCardNumber && (
                          <p className="text-muted-foreground">
                            Carte: <span className="font-medium text-foreground">{selectedPatient.insuranceCardNumber}</span>
                          </p>
                        )}
                        {selectedPatient.insuranceExpiryDate && (
                          <p className="text-muted-foreground">
                            Expire le: <span className="font-medium text-foreground">{selectedPatient.insuranceExpiryDate}</span>
                          </p>
                        )}
                        <p className="text-muted-foreground">
                          Couverture Générale: <span className="font-bold text-primary">{selectedPatient.coverageRate}%</span>
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-muted/50 rounded-lg p-3 flex items-center gap-2">
                      <ShieldOff className="size-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">Sans Assurance</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 shadow-lg">
              <CardHeader className="pb-3 pt-4">
                <CardTitle className="text-xs font-bold uppercase tracking-widest text-primary">Ajouter un Acte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Service</label>
                  <Select value={selectedServiceId} onValueChange={(v) => {
                    setSelectedServiceId(v)
                    setSelectedActId("")
                  }}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Tous les services" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les services</SelectItem>
                      {loadingServices ? (
                        <div className="p-2 text-center text-xs text-muted-foreground">Chargement...</div>
                      ) : (
                        services.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase text-muted-foreground ml-1">Acte Médical</label>
                  <Select value={selectedActId} onValueChange={setSelectedActId}>
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Choisir un acte..." />
                    </SelectTrigger>
                    <SelectContent>
                      {loadingActs ? (
                        <div className="p-2 text-center text-xs text-muted-foreground">Chargement...</div>
                      ) : (
                        filteredActs.map((act) => (
                          <SelectItem key={act.id} value={act.id}>
                            <span className="font-medium">{act.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">— {parseFloat(act.basePrice).toLocaleString()} FBU</span>
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <Button
                    className="w-full h-11 transition-all hover:translate-y-[-1px]"
                    onClick={addItem}
                    disabled={!selectedActId}
                  >
                    <Plus className="size-4 mr-2" />
                    Ajouter à la facture
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: List & Summary */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            <Card className="flex-1 shadow-sm border-0 bg-transparent ring-1 ring-border">
              <CardHeader className="pb-3 border-b bg-muted/20">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Détails de la Facture</CardTitle>
                    <CardDescription>{items.length} élément{items.length > 1 ? 's' : ''} ajouté{items.length > 1 ? 's' : ''}</CardDescription>
                  </div>
                  {lastInvoice && (
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                      <Printer className="size-4 mr-2" />
                      Réimprimer
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {items.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-muted-foreground bg-card/50">
                    <p className="text-sm italic">Aucun acte sélectionné pour le moment.</p>
                  </div>
                ) : (
                  <div className="divide-y">
                    {items.map((item) => (
                      <div key={item.id} className="group flex items-center justify-between p-4 bg-card hover:bg-muted/30 transition-colors">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm font-bold text-foreground">{item.actName}</span>
                            <Badge variant="secondary" className="text-[9px] font-mono leading-none bg-muted px-1.5 h-4">{item.actCode}</Badge>
                          </div>
                          <div className="flex items-center gap-6 text-[11px] text-muted-foreground font-medium uppercase tracking-wider">
                            <span>Prix: {item.unitPrice.toLocaleString()} FBU</span>
                            {selectedPatient.isInsured && (
                              <span className="text-primary">Part Mutuelle: {item.insurancePart.toLocaleString()} FBU</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-8">
                          <div className="text-right">
                            <p className="text-sm font-black text-foreground">{item.patientPart.toLocaleString()} FBU</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Part Patient</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-9 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payment Section */}
              <Card className="border-primary/20 shadow-md">
                <CardHeader className="pb-3 pt-4">
                  <CardTitle className="text-xs font-black uppercase text-primary tracking-widest">Paiement Immédiat</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant={paymentMethod === 'cash' ? 'default' : 'outline'}
                      className={`h-16 flex-col gap-1 ${paymentMethod === 'cash' ? 'bg-primary border-primary' : ''}`}
                      onClick={() => setPaymentMethod('cash')}
                    >
                      <Banknote className="size-5" />
                      <span className="text-[10px] font-bold">CASH</span>
                    </Button>
                    <Button
                      variant={paymentMethod === 'mobile_money' ? 'default' : 'outline'}
                      className={`h-16 flex-col gap-1 ${paymentMethod === 'mobile_money' ? 'bg-primary border-primary' : ''}`}
                      onClick={() => setPaymentMethod('mobile_money')}
                    >
                      <Smartphone className="size-5" />
                      <span className="text-[10px] font-bold uppercase leading-none">MOB MONEY</span>
                    </Button>
                  </div>

                  {paymentMethod === 'mobile_money' && (
                    <div className="space-y-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
                      <label className="text-[10px] font-black text-muted-foreground uppercase ml-1">Référence Transaction</label>
                      <Input
                        placeholder="Ex: PP2304..."
                        className="h-10 text-sm font-mono"
                        value={paymentReference}
                        onChange={(e) => setPaymentReference(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="bg-muted/30 p-3 rounded-lg flex items-center justify-between border border-dashed">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Agréé par</p>
                      <p className="text-xs font-medium">Caissier Principal</p>
                    </div>
                    <Badge variant="outline" className="bg-background text-xs opacity-70">
                      AUTO-PAY
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Summary and Validation */}
              <div className="space-y-6">
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4 py-3 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-muted-foreground font-medium">Sous-total :</span>
                      <span className="font-bold">{totals.total.toLocaleString()} FBU</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-primary">
                      <span className="font-medium">Assurance :</span>
                      <span className="font-bold">-{totals.insTotal.toLocaleString()} FBU</span>
                    </div>
                    <Separator className="bg-primary/10" />
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-[10px] font-black uppercase text-slate-500">Net Patient :</span>
                      <div className="text-right">
                        <p className="text-2xl font-black text-primary">{totals.patTotal.toLocaleString()}</p>
                        <p className="text-[8px] font-bold text-muted-foreground">FRANC BURUNDAIS</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black text-base shadow-2xl relative overflow-hidden group"
                  disabled={items.length === 0 || isSubmitting || (paymentMethod === 'mobile_money' && !paymentReference)}
                  onClick={handleValidate}
                >
                  <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Traitement...</>
                  ) : (
                    <><Check className="mr-2 h-6 w-6 text-primary" /> ENREGISTRER & IMPRIMER</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed rounded-3xl bg-secondary/5">
          <div className="bg-secondary/10 p-6 rounded-full mb-4">
            <User className="size-12 text-muted-foreground/40" />
          </div>
          <p className="text-lg font-bold text-foreground">Aucun patient sélectionné</p>
          <p className="text-sm text-muted-foreground max-w-xs text-center mt-2">
            Utilisez la barre de recherche ci-dessus pour trouver un patient et commencer la facturation.
          </p>
        </div>
      )}
    </div>
  )
}
