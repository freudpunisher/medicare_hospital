"use client"

import { useState, useMemo } from "react"
import { Search, Plus, Trash2, User, Shield, ShieldOff, Check } from "lucide-react"
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
import { patients, acts, services, insurances, insuranceServiceRules } from "@/lib/mock-data"
import { toast } from "sonner"

interface InvoiceItem {
  id: string
  act_id: string
  quantity: number
  unit_price: number
  insurance_part: number
  patient_part: number
}

function calculateInsuranceCoverage(
  actId: string,
  unitPrice: number,
  quantity: number,
  insuranceId: string | null
): { insurance_part: number; patient_part: number } {
  const total = unitPrice * quantity
  if (!insuranceId) return { insurance_part: 0, patient_part: total }

  const act = acts.find((a) => a.id === actId)
  if (!act) return { insurance_part: 0, patient_part: total }

  const rule = insuranceServiceRules.find(
    (r) => r.insurance_id === insuranceId && r.service_id === act.service_id
  )
  if (!rule) return { insurance_part: 0, patient_part: total }

  let covered = total * (rule.coverage_rate / 100)
  if (rule.plafond != null && covered > rule.plafond) {
    covered = rule.plafond
  }

  return {
    insurance_part: Math.round(covered * 100) / 100,
    patient_part: Math.round((total - covered) * 100) / 100,
  }
}

export default function BillingPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null)
  const [items, setItems] = useState<InvoiceItem[]>([])
  const [selectedActId, setSelectedActId] = useState<string>("")
  const [showSearch, setShowSearch] = useState(false)

  const selectedPatient = patients.find((p) => p.id === selectedPatientId)
  const insurance = insurances.find((i) => i.id === selectedPatient?.insurance_id)

  const filteredPatients = patients.filter(
    (p) =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery)
  )

  const totals = useMemo(() => {
    const total = items.reduce((sum, i) => sum + i.unit_price * i.quantity, 0)
    const insTotal = items.reduce((sum, i) => sum + i.insurance_part, 0)
    const patTotal = items.reduce((sum, i) => sum + i.patient_part, 0)
    return { total, insTotal, patTotal }
  }, [items])

  function addItem() {
    if (!selectedActId || !selectedPatientId) return
    const act = acts.find((a) => a.id === selectedActId)
    if (!act) return

    const coverage = calculateInsuranceCoverage(
      act.id,
      act.base_price,
      1,
      selectedPatient?.insurance_id ?? null
    )

    setItems((prev) => [
      ...prev,
      {
        id: `ii-${Date.now()}`,
        act_id: act.id,
        quantity: 1,
        unit_price: act.base_price,
        ...coverage,
      },
    ])
    setSelectedActId("")
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  function handleValidate() {
    if (items.length === 0) return
    toast.success("Invoice created successfully", {
      description: `Total: $${totals.total.toFixed(2)} | Patient: $${totals.patTotal.toFixed(2)}`,
    })
    setItems([])
    setSelectedPatientId(null)
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Billing" description="Create invoices for patient visits" />

      {/* Patient Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              placeholder="Search patient by name or phone to start billing..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value)
                setShowSearch(e.target.value.length > 0)
              }}
              onFocus={() => searchQuery.length > 0 && setShowSearch(true)}
              onBlur={() => setTimeout(() => setShowSearch(false), 200)}
            />
            {showSearch && searchQuery && (
              <div className="absolute top-full left-0 right-0 z-50 mt-1 rounded-lg border bg-popover shadow-lg max-h-60 overflow-auto">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <button
                      key={patient.id}
                      className="flex w-full items-center gap-3 px-3 py-2.5 text-sm hover:bg-accent text-left"
                      onMouseDown={() => {
                        setSelectedPatientId(patient.id)
                        setSearchQuery("")
                        setShowSearch(false)
                        setItems([])
                      }}
                    >
                      <User className="size-4 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-popover-foreground">
                          {patient.first_name} {patient.last_name}
                        </p>
                        <p className="text-xs text-muted-foreground">{patient.phone}</p>
                      </div>
                      {patient.is_insured && (
                        <Badge variant="outline" className="ml-auto border-primary/30 bg-primary/5 text-primary text-xs">
                          <Shield className="size-3 mr-1" />
                          Insured
                        </Badge>
                      )}
                    </button>
                  ))
                ) : (
                  <p className="px-3 py-2 text-sm text-muted-foreground">No patients found</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {selectedPatient && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Patient Info Card */}
          <div className="lg:col-span-3 space-y-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Patient Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-lg font-semibold text-foreground">
                    {selectedPatient.first_name} {selectedPatient.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedPatient.phone}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedPatient.gender} | {new Date(selectedPatient.date_of_birth).toLocaleDateString()}
                  </p>
                </div>
                <Separator />
                <div>
                  {selectedPatient.is_insured ? (
                    <div className="space-y-1">
                      <Badge variant="outline" className="border-primary/30 bg-primary/5 text-primary text-xs">
                        <Shield className="size-3 mr-1" />
                        {insurance?.name ?? "Insured"}
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        No.: {selectedPatient.insurance_number}
                      </p>
                    </div>
                  ) : (
                    <Badge variant="outline" className="border-muted-foreground/30 text-muted-foreground text-xs">
                      <ShieldOff className="size-3 mr-1" />
                      No Insurance
                    </Badge>
                  )}
                </div>
                <Separator />
                {/* Add Acts */}
                <div className="space-y-2">
                  <p className="text-sm font-medium text-foreground">Add Act</p>
                  <Select value={selectedActId} onValueChange={setSelectedActId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select an act..." />
                    </SelectTrigger>
                    <SelectContent>
                      {acts
                        .filter((a) => a.is_active)
                        .map((act) => (
                          <SelectItem key={act.id} value={act.id}>
                            {act.name} - ${act.base_price.toFixed(2)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" className="w-full" onClick={addItem} disabled={!selectedActId}>
                    <Plus className="size-4 mr-1" />
                    Add to Invoice
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Invoice Items */}
          <div className="lg:col-span-5">
            <Card className="h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Invoice Items</CardTitle>
                <CardDescription>
                  {items.length} item{items.length !== 1 ? "s" : ""} added
                </CardDescription>
              </CardHeader>
              <CardContent>
                {items.length === 0 ? (
                  <div className="text-center py-10">
                    <p className="text-sm text-muted-foreground">
                      No items yet. Add medical acts from the left panel.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {items.map((item) => {
                      const act = acts.find((a) => a.id === item.act_id)
                      const service = services.find((s) => s.id === act?.service_id)
                      return (
                        <div
                          key={item.id}
                          className="flex items-start justify-between rounded-lg border p-3"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-foreground">{act?.name}</p>
                              <Badge variant="secondary" className="text-[10px]">{act?.code}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">{service?.name}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs">
                              <span className="text-muted-foreground">
                                Qty: {item.quantity} x ${item.unit_price.toFixed(2)}
                              </span>
                              {selectedPatient.is_insured && item.insurance_part > 0 && (
                                <span className="text-primary">
                                  Ins: ${item.insurance_part.toFixed(2)}
                                </span>
                              )}
                              <span className="font-medium text-foreground">
                                Patient: ${item.patient_part.toFixed(2)}
                              </span>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="size-8 text-muted-foreground hover:text-destructive"
                            onClick={() => removeItem(item.id)}
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      )
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Calculation Summary */}
          <div className="lg:col-span-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Invoice Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">
                      ${totals.total.toFixed(2)}
                    </span>
                  </div>
                  {selectedPatient.is_insured && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Insurance Covers</span>
                      <span className="font-medium text-primary">
                        -${totals.insTotal.toFixed(2)}
                      </span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">Patient Owes</span>
                  <span className="text-xl font-bold text-foreground">
                    ${totals.patTotal.toFixed(2)}
                  </span>
                </div>

                {selectedPatient.is_insured && insurance && (
                  <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                    <p className="text-xs font-medium text-primary">{insurance.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Coverage applied based on service rules
                    </p>
                  </div>
                )}

                <Button
                  className="w-full"
                  disabled={items.length === 0}
                  onClick={handleValidate}
                >
                  <Check className="size-4 mr-1" />
                  Validate Invoice
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
