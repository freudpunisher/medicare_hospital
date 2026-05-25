"use client"

import { useState, useMemo, useEffect } from "react"
import { Search, Plus, Trash2, User, Shield, ShieldOff, Check, Loader2 } from "lucide-react"
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
    if (!rule) {
      return { insurancePart: 0, patientPart: total }
    }

    const rate = parseFloat(rule.coverageRate) / 100
    let covered = total * rate

    if (rule.plafond) {
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
      const res = await fetch("/api/billing/invoices/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientId: selectedPatient.id,
          totalAmount: totals.total,
          insuranceAmount: totals.insTotal,
          patientAmount: totals.patTotal,
          items: items.map(i => ({
            actId: i.actId,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            totalPrice: i.totalPrice,
          }))
        })
      })

      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error || "Échec de la validation de la facture")
        return
      }

      toast.success("Facture validée avec succès", {
        description: `Total: ${totals.total.toLocaleString()} FBU | Patient: ${totals.patTotal.toLocaleString()} FBU`,
      })
      setItems([])
      setSelectedPatient(null)
      setSearchQuery("")
    } catch (err) {
      toast.error("Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Facturation" description="Créer des factures pour les consultations et actes médicaux" />

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

                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-muted/50 p-2 rounded-md">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Genre</p>
                    <p className="font-medium capitalize">{selectedPatient.gender === 'male' ? 'Homme' : 'Femme'}</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded-md">
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Âge</p>
                    <p className="font-medium">{new Date().getFullYear() - new Date(selectedPatient.dateOfBirth).getFullYear()} ans</p>
                  </div>
                </div>

                <Separator />

                <div>
                  {selectedPatient.isInsured ? (
                    <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Shield className="size-4 text-green-600" />
                        <span className="text-sm font-bold text-green-600">Patient Assuré</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Matricule: <span className="font-medium text-foreground">{selectedPatient.insuranceNumber}</span>
                      </p>
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
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Ajouter un Acte</CardTitle>
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
                    variant="primary"
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
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">Détails de la Facture</CardTitle>
                    <CardDescription>{items.length} élément{items.length > 1 ? 's' : ''} ajouté{items.length > 1 ? 's' : ''}</CardDescription>
                  </div>
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
              <Card className="bg-primary/5 border-primary/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black uppercase text-primary tracking-widest">Couverture Assurance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-baseline justify-between">
                    <p className="text-3xl font-black text-primary">{totals.insTotal.toLocaleString()}</p>
                    <span className="text-xs font-bold text-primary/70">FBU</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 italic">
                    Calculé selon les règles de service de la mutuelle.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-slate-900 border-slate-800 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 blur-[100px]" />
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-widest underline decoration-primary/50 underline-offset-4">Net à Payer (Patient)</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline justify-between">
                    <p className="text-4xl font-black text-white">{totals.patTotal.toLocaleString()}</p>
                    <span className="text-[10px] font-black text-slate-500 tracking-tighter uppercase">Burundi Francs (FBU)</span>
                  </div>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-black h-12 text-base shadow-lg shadow-primary/20"
                    disabled={items.length === 0 || isSubmitting}
                    onClick={handleValidate}
                  >
                    {isSubmitting ? (
                      <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Traitement...</>
                    ) : (
                      <><Check className="mr-2 h-5 w-5" /> Valider la Facture</>
                    )}
                  </Button>
                </CardContent>
              </Card>
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
