"use client"

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Search, Plus, Trash2, User, UserPlus, Shield, ShieldOff, Check, Loader2, Printer, Banknote, Smartphone, Tag, CreditCard, History as HistoryIcon, Landmark } from "lucide-react"
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
import { useState, useMemo, useEffect, useRef } from "react"
import { useCurrentUser } from "@/hooks/use-current-user"

interface Act {
  id: string
  code: string
  name: string
  serviceId: string
  specialtyId: string | null
  basePrice: string
  isActive: boolean
}

interface PatientInsurance {
  id: string
  insuranceId: string
  insuranceNumber: string | null
  insuranceCardNumber: string | null
  insuranceExpiryDate: string | null
  coverageRate: string
  isPrimary: boolean
  insurance: {
    id: string
    name: string
  }
}

interface Patient {
  id: string
  patientNumber: number
  firstName: string
  lastName: string
  phone: string
  isInsured: boolean
  gender: string
  dateOfBirth: string
  coverageRate: string
  insurances: PatientInsurance[]
  isCorporateEmployee: boolean
  corporatePartnerId: string | null
  corporateEmployeeId: string | null
}

interface PartnershipRule {
  id: string
  partnerId: string
  agreementId: string
  serviceId: string | null
  medicalActId: string | null
  specialtyId: string | null
  reductionType: 'percentage' | 'fixed_amount'
  reductionValue: string
  maxReductionAmount: string | null
  minBillableAmount: string | null
  priority: string
  notes: string | null
  isActive: boolean
}

interface PartnershipData {
  partner: { id: string; companyName: string }
  employee: { id: string; employeeNumber: string; department: string | null; position: string | null }
  agreements: any[]
  rules: PartnershipRule[]
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
  coverageRate: number
  coverageSource: 'rule' | 'patient' | 'none'
  partnershipDiscount: number
  partnershipRuleId: string | null
  partnershipDiscountType: string | null
  partnershipDiscountValue: number | null
  partnershipOriginalPatientPart: number
}

export default function BillingPage() {
  const { user } = useCurrentUser()
  const [searchQuery, setSearchQuery] = useState("")
  const [patients, setPatients] = useState<Patient[]>([])
  const [acts, setActs] = useState<Act[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [selectedInsuranceIds, setSelectedInsuranceIds] = useState<string[]>([])
  const [insuranceRulesMap, setInsuranceRulesMap] = useState<Record<string, InsuranceRule[]>>({})
  const [items, setItems] = useState<InvoiceItem[]>([])

  // Recalculate items when insurance selection or rules change
  useEffect(() => {
    if (items.length > 0 && selectedPatient) {
      setItems(prevItems => prevItems.map(item => {
        const act = acts.find(a => a.id === item.actId)
        if (!act) return item
        const { insurancePart, patientPart, rate, source } = calculateCoverage(act, item.quantity)
        const partnership = calculatePartnershipDiscount(act, patientPart)
        return {
          ...item,
          insurancePart,
          patientPart: patientPart - partnership.discount,
          coverageRate: rate,
          coverageSource: source,
          partnershipDiscount: partnership.discount,
          partnershipRuleId: partnership.ruleId,
          partnershipDiscountType: partnership.discountType,
          partnershipDiscountValue: partnership.discountValue,
          partnershipOriginalPatientPart: patientPart,
        }
      }))
    }
  }, [selectedInsuranceIds, insuranceRulesMap])

  const [selectedServiceId, setSelectedServiceId] = useState<string>("all")
  const [selectedActId, setSelectedActId] = useState<string>("")
  const [showSearch, setShowSearch] = useState(false)
  const [loadingPatients, setLoadingPatients] = useState(false)
  const [loadingActs, setLoadingActs] = useState(false)
  const [loadingServices, setLoadingServices] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "mobile_money" | "card" | "loan">("cash")
  const [paymentReference, setPaymentReference] = useState("")
  const [discountAmount, setDiscountAmount] = useState(0)
  const [lastInvoice, setLastInvoice] = useState<any>(null)
  const [openSessions, setOpenSessions] = useState<any[]>([])
  const [selectedSessionId, setSelectedSessionId] = useState<string>("")
  const [partnershipData, setPartnershipData] = useState<PartnershipData | null>(null)
  const [loadingPartnership, setLoadingPartnership] = useState(false)
  const receiptRef = useRef<HTMLDivElement>(null)
  const searchParams = useSearchParams()

  // Auto-select patient from URL param
  useEffect(() => {
    const patientId = searchParams.get("patientId")
    if (!patientId) return

    fetch(`/api/patients/${patientId}`)
      .then((res) => res.json())
      .then((data) => {
        if (!data || !data.id) return
        setSelectedPatient(data)
        setItems([])
        const IDs = data.insurances?.map((i: any) => i.insuranceId) || []
        setSelectedInsuranceIds(IDs)
      })
      .catch((err) => console.error("Failed to load patient from URL", err))
  }, [])

  // Fetch acts, services, and open cash sessions on mount
  useEffect(() => {
    async function fetchInitialData() {
      setLoadingActs(true)
      setLoadingServices(true)
      try {
        const [actsRes, servicesRes, sessionsRes] = await Promise.all([
          fetch("/api/acts/list"),
          fetch("/api/services/list?active=true"),
          fetch("/api/finance/cash-sessions?status=open")
        ])
        const actsData = await actsRes.json()
        const servicesData = await servicesRes.json()
        const sessionsData = await sessionsRes.json()

        if (actsRes.ok) setActs(actsData.data || [])
        if (servicesRes.ok) setServices(servicesData.data || [])
        if (sessionsRes.ok) {
          const sessions = sessionsData.data || []
          setOpenSessions(sessions)
          if (sessions.length > 0) setSelectedSessionId(sessions[0].id)
        }
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
      if (searchQuery.length >= 1) {
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

  // Fetch partnership discounts when patient is selected
  useEffect(() => {
    async function fetchPartnershipData() {
      if (selectedPatient?.isCorporateEmployee && selectedPatient.corporatePartnerId) {
        setLoadingPartnership(true)
        try {
          const res = await fetch(`/api/partners/patient-discounts?patientId=${selectedPatient.id}`)
          const data = await res.json()
          if (data.success && data.data) {
            setPartnershipData(data.data)
          } else {
            setPartnershipData(null)
          }
        } catch (err) {
          console.error("Failed to fetch partnership data")
          setPartnershipData(null)
        } finally {
          setLoadingPartnership(false)
        }
      } else {
        setPartnershipData(null)
      }
    }
    fetchPartnershipData()
  }, [selectedPatient])

  // Recalculate partnership discounts when partnershipData loads/unloads
  useEffect(() => {
    if (items.length === 0) return
    setItems(prevItems => prevItems.map(item => {
      const act = acts.find(a => a.id === item.actId)
      if (!act) return item
      const base = item.partnershipOriginalPatientPart
      if (partnershipData) {
        const { discount, ruleId, discountType, discountValue } = calculatePartnershipDiscount(act, base)
        return {
          ...item,
          partnershipDiscount: discount,
          partnershipRuleId: ruleId,
          partnershipDiscountType: discountType,
          partnershipDiscountValue: discountValue,
          partnershipOriginalPatientPart: base,
          patientPart: base - discount,
        }
      } else {
        return {
          ...item,
          partnershipDiscount: 0,
          partnershipRuleId: null,
          partnershipDiscountType: null,
          partnershipDiscountValue: null,
          partnershipOriginalPatientPart: base,
          patientPart: base,
        }
      }
    }))
  }, [partnershipData])

  // Fetch insurance rules when selected insurances change
  useEffect(() => {
    async function fetchAllRules() {
      if (selectedInsuranceIds.length > 0) {
        try {
          const newMap: Record<string, InsuranceRule[]> = {}
          await Promise.all(
            selectedInsuranceIds.map(async (id) => {
              const res = await fetch(`/api/insurances/rules?insuranceId=${id}`)
              const data = await res.json()
              if (res.ok) {
                newMap[id] = data.data || []
              }
            })
          )
          setInsuranceRulesMap(newMap)
        } catch (err) {
          console.error("Failed to fetch insurance rules")
        }
      } else {
        setInsuranceRulesMap({})
      }
    }
    fetchAllRules()
  }, [selectedInsuranceIds])

  const filteredActs = useMemo(() => {
    if (selectedServiceId === "all") return acts.filter(a => a.isActive)
    return acts.filter(a => a.isActive && a.serviceId === selectedServiceId)
  }, [acts, selectedServiceId])

  const totals = useMemo(() => {
    const total = items.reduce((sum, i) => sum + i.totalPrice, 0)
    const insTotal = items.reduce((sum, i) => sum + i.insurancePart, 0)
    const patGrossTotal = items.reduce((sum, i) => sum + i.partnershipOriginalPatientPart, 0)
    const patTotal = items.reduce((sum, i) => sum + i.patientPart, 0)
    const partnershipTotal = items.reduce((sum, i) => sum + i.partnershipDiscount, 0)
    return { total, insTotal, patTotal, patGrossTotal, partnershipTotal }
  }, [items])

  function calculateCoverage(act: Act, qty: number): { insurancePart: number; patientPart: number; rate: number; source: 'rule' | 'patient' | 'none' } {
    const unitPrice = parseFloat(act.basePrice)
    const total = unitPrice * qty

    if (selectedInsuranceIds.length === 0) {
      return { insurancePart: 0, patientPart: total, rate: 0, source: 'none' }
    }

    let bestRate = 0
    let bestSource: 'rule' | 'patient' | 'none' = 'none'
    let bestCovered = 0

    // Iterate through all selected insurances to find the best coverage
    selectedInsuranceIds.forEach(insId => {
      const patientIns = selectedPatient!.insurances.find(i => i.insuranceId === insId)
      if (!patientIns) return

      const rules = insuranceRulesMap[insId] || []
      const rule = rules.find(r => r.serviceId === act.serviceId)

      const currentSource = rule ? 'rule' : 'patient'
      let rawRate = rule ? rule.coverageRate : patientIns.coverageRate

      // Fallback to patient global rate if insurance rate is 0 and no rule
      if (!rule && (parseFloat(rawRate) === 0 || !rawRate) && selectedPatient!.coverageRate) {
        rawRate = selectedPatient!.coverageRate
      }

      const currentRate = parseFloat(rawRate)

      let currentCovered = total * (currentRate / 100)

      if (rule && rule.plafond) {
        const plafond = parseFloat(rule.plafond)
        if (currentCovered > plafond) currentCovered = plafond
      }

      if (currentCovered > bestCovered || (currentCovered === bestCovered && currentRate > bestRate)) {
        bestCovered = currentCovered
        bestRate = currentRate
        bestSource = currentSource
      }
    })

    if (bestSource === 'none' && selectedInsuranceIds.length > 0) {
      bestSource = 'patient'
    }

    return {
      insurancePart: Math.round(bestCovered),
      patientPart: total - Math.round(bestCovered),
      rate: bestRate,
      source: bestSource
    }
  }

  function calculatePartnershipDiscount(
    act: Act,
    patientPart: number,
  ): { discount: number; ruleId: string | null; discountType: string | null; discountValue: number | null } {
    if (!partnershipData || !partnershipData.rules.length || patientPart <= 0) {
      return { discount: 0, ruleId: null, discountType: null, discountValue: null }
    }

    const matchingRules = partnershipData.rules.filter(rule => {
      if (rule.medicalActId && rule.medicalActId === act.id) return true
      if (!rule.medicalActId && rule.serviceId && rule.serviceId === act.serviceId) return true
      if (!rule.medicalActId && !rule.serviceId && rule.specialtyId && rule.specialtyId === act.specialtyId) return true
      if (!rule.medicalActId && !rule.serviceId && !rule.specialtyId) return true
      return false
    })

    if (matchingRules.length === 0) {
      return { discount: 0, ruleId: null, discountType: null, discountValue: null }
    }

    const rule = matchingRules[0]

    let discount = 0
    if (rule.reductionType === 'percentage') {
      discount = patientPart * (Number(rule.reductionValue) / 100)
    } else {
      discount = Number(rule.reductionValue)
    }

    if (rule.maxReductionAmount) {
      discount = Math.min(discount, Number(rule.maxReductionAmount))
    }

    discount = Math.min(discount, patientPart)
    discount = Math.round(discount)

    return {
      discount,
      ruleId: rule.id,
      discountType: rule.reductionType,
      discountValue: Number(rule.reductionValue),
    }
  }

  function addItem() {
    if (!selectedActId || !selectedPatient) return
    const act = acts.find((a) => a.id === selectedActId)
    if (!act) return

    const { insurancePart, patientPart, rate, source } = calculateCoverage(act, 1)
    const partnership = calculatePartnershipDiscount(act, patientPart)

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
        patientPart: patientPart - partnership.discount,
        totalPrice: parseFloat(act.basePrice),
        coverageRate: rate,
        coverageSource: source,
        partnershipDiscount: partnership.discount,
        partnershipRuleId: partnership.ruleId,
        partnershipDiscountType: partnership.discountType,
        partnershipDiscountValue: partnership.discountValue,
        partnershipOriginalPatientPart: patientPart,
      },
    ])
    setSelectedActId("")
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const handlePrint = (invoiceData: any) => {
    if (!invoiceData) return;

    const receiptHtml = receiptRef.current?.innerHTML;
    if (!receiptHtml) return;

    const win = window.open("", "_blank", "width=800,height=500");
    if (!win) return;

    win.document.write(`
      <html>
        <head>
          <title>Reçu - ${invoiceData.invoiceNumber}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            html { height: auto; }
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              font-weight: 400;
              background: #fff;
              width: 72mm;
              max-width: 72mm;
              padding: 0;
              margin: 0;
              line-height: 1.25;
            }
            .receipt-container {
              width: 72mm;
              padding: 2mm;
              margin: 0;
              background: #fff;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: 700; }
            .font-black { font-weight: 900; }
            .uppercase { text-transform: uppercase; }
            .italic { font-style: italic; }
            .mt-1 { margin-top: 2px; }
            .mb-2 { margin-bottom: 4px; }
            
            hr {
              border: 0;
              border-top: 1px dashed #000;
              margin: 4px 0;
              height: 0;
            }
            
            .info-table, .receipt-table, .total-table {
              width: 100%;
              border-collapse: collapse;
              margin: 3px 0;
              table-layout: fixed;
            }
            .info-table td, .receipt-table td, .receipt-table th, .total-table td {
              font-family: 'Courier New', Courier, monospace;
              font-size: 11px;
              line-height: 1.25;
              padding: 1px 0;
              vertical-align: top;
            }
            
            .info-table td.lbl {
              text-align: left;
              width: 32%;
            }
            .info-table td.val {
              text-align: right;
              width: 68%;
              font-weight: bold;
              word-break: break-word;
              overflow-wrap: break-word;
            }
            
            .receipt-table th {
              border-bottom: 1px solid #000;
              font-weight: 700;
            }
            .receipt-table td.act-name {
              word-break: break-word;
              overflow-wrap: break-word;
            }
            
            .total-table td.lbl {
              text-align: left;
              width: 50%;
            }
            .total-table td.val {
              text-align: right;
              width: 50%;
              font-weight: bold;
            }
            .total-table tr.pay-row td {
              font-size: 15px;
              font-weight: 900;
              border-top: 1px solid #000;
              border-bottom: 1px solid #000;
              padding: 3px 0;
            }
            #print-content { display: block; width: 100%; }
            @media print {
              @page { size: auto; margin: 0mm; }
              html, body {
                height: auto !important;
                min-height: 0 !important;
                margin: 0 !important;
                padding: 0 !important;
                width: 72mm !important;
                overflow: visible !important;
              }
              #print-content { page-break-after: avoid; break-after: avoid; }
            }
          </style>
        </head>
        <body onload="setTimeout(function(){window.print();window.close()},150)">
          <div id="print-content">${receiptHtml}</div>
        </body>
      </html>
    `);
    win.document.close();
  };

  async function handleValidate() {
    if (items.length === 0 || !selectedPatient) return
    setIsSubmitting(true)
    try {
      const partnershipTotalDiscount = items.reduce((sum, i) => sum + i.partnershipDiscount, 0)

      const payload: Record<string, any> = {
        patientId: selectedPatient.id,
        totalAmount: totals.total,
        insuranceAmount: totals.insTotal,
        patientAmount: totals.patTotal - discountAmount,
        discountAmount: discountAmount,
        partnershipDiscountAmount: partnershipTotalDiscount,
        paymentMethod,
        paymentReference: paymentMethod === 'mobile_money' ? paymentReference : null,
        cashSessionId: selectedSessionId || null,
        items: items.map(i => ({
          actId: i.actId,
          quantity: i.quantity,
          unitPrice: i.unitPrice,
          totalPrice: i.totalPrice,
        }))
      }

      if (partnershipData && partnershipTotalDiscount > 0) {
        payload.partnershipData = {
          partnerId: partnershipData.partner.id,
          employeeId: partnershipData.employee.id,
          items: items
            .map((i, idx) => ({ ...i, itemIndex: idx }))
            .filter(i => i.partnershipDiscount > 0)
            .map(i => ({
              itemIndex: i.itemIndex,
              ruleId: i.partnershipRuleId!,
              originalPrice: i.totalPrice,
              discountedPrice: i.totalPrice - i.partnershipDiscount,
              discountAmount: i.partnershipDiscount,
              discountType: i.partnershipDiscountType,
              discountValue: i.partnershipDiscountValue,
            })),
        }
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

      const invoiceData = {
        ...resData.data,
        patient: selectedPatient,
        selectedInsurances: selectedPatient.insurances.filter(i => selectedInsuranceIds.includes(i.insuranceId)),
        items: [...items],
        paymentMethod,
        paymentReference,
        totals: { ...totals },
        partnershipData: partnershipData,
      };

      setLastInvoice(invoiceData)

      toast.success("Facture validée et paiement enregistré", {
        description: `Total: ${totals.total.toLocaleString()} FBU | Patient: ${(totals.patTotal - discountAmount).toLocaleString()} FBU`,
      })

      setTimeout(() => {
        handlePrint(invoiceData);
      }, 300);
      setItems([])
      setSelectedPatient(null)
      setSearchQuery("")
      setPaymentReference("")
      setDiscountAmount(0)
      setPartnershipData(null)

    } catch (err) {
      toast.error("Une erreur est survenue")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Facturation" description="Gérer les factures et les paiements immédiats" />

      {/* Off-screen thermal receipt container */}
      <div style={{ position: "fixed", left: "-9999px", top: 0 }}>
        <div ref={receiptRef}>
          {lastInvoice && (
            <div className="receipt-container">
              <div className="text-center mb-2">
                <h2 className="font-bold uppercase" style={{ fontSize: '13px' }}>CLINIQUE MEDICO-DENTAIRE<br />Le SOURIRE</h2>
                <p className="font-bold">NIF: 500253456</p>
                <p>Forme juridique: SURL | RC: 00734372/25</p>
                <p>Centre fiscal: DPMC</p>
              </div>

              <hr />

              <table className="info-table">
                <tbody>
                  <tr>
                    <td className="lbl">DATE:</td>
                    <td className="val">{new Date(lastInvoice.createdAt).toLocaleString('fr-FR')}</td>
                  </tr>
                  <tr>
                    <td className="lbl">FACT NO:</td>
                    <td className="val">{lastInvoice.invoiceNumber}</td>
                  </tr>
                  <tr className="italic">
                    <td className="lbl">CAISSIER:</td>
                    <td className="val uppercase">{user?.fullName || user?.username || 'Système'}</td>
                  </tr>
                  <tr>
                    <td className="lbl">PATIENT:</td>
                    <td className="val uppercase">{lastInvoice.patient.firstName} {lastInvoice.patient.lastName}</td>
                  </tr>
                  <tr>
                    <td className="lbl">ID:</td>
                    <td className="val uppercase">#{lastInvoice.patient.patientNumber}</td>
                  </tr>
                </tbody>
              </table>

              {lastInvoice.selectedInsurances && lastInvoice.selectedInsurances.length > 0 && (
                <div style={{ marginTop: '4px' }}>
                  <p className="font-bold">ASSURANCES ({lastInvoice.selectedInsurances.length}):</p>
                  <table className="info-table" style={{ margin: 0 }}>
                    <tbody>
                      {lastInvoice.selectedInsurances.map((si: any) => (
                        <tr key={si.id} className="italic" style={{ fontSize: '10px' }}>
                          <td className="lbl" style={{ paddingLeft: '4px' }}>- {si.insurance.name}:</td>
                          <td className="val">{si.insuranceNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <hr />

              <table className="receipt-table">
                <thead>
                  <tr>
                    <th style={{ width: '75%', textAlign: 'left' }}>ITEM</th>
                    <th style={{ width: '25%', textAlign: 'right' }}>PRIX</th>
                  </tr>
                </thead>
                <tbody>
                  {lastInvoice.items.map((item: any) => (
                    <tr key={item.id}>
                      <td className="act-name">
                        {item.actName}
                        <br />
                        <span className="italic font-bold" style={{ fontSize: '9px' }}>{item.actCode}</span>
                      </td>
                      <td style={{ textAlign: 'right' }}>{item.patientPart.toLocaleString()}FBU</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <hr />

              <table className="total-table">
                <tbody>
                  <tr>
                    <td className="lbl">TOTAL BRUT:</td>
                    <td className="val">{lastInvoice.totals.total.toLocaleString()} FBU</td>
                  </tr>
                  <tr>
                    <td className="lbl">PART ASSURANCE:</td>
                    <td className="val">-{lastInvoice.totals.insTotal.toLocaleString()} FBU</td>
                  </tr>
                  {lastInvoice.totals.partnershipTotal > 0 && (
                    <tr style={{ color: '#000' }}>
                      <td className="lbl">Remise Corporate:</td>
                      <td className="val">-{lastInvoice.totals.partnershipTotal.toLocaleString()} FBU</td>
                    </tr>
                  )}
                  <tr className="pay-row">
                    <td className="lbl">À PAYER:</td>
                    <td className="val">{lastInvoice.totals.patTotal.toLocaleString()} FBU</td>
                  </tr>
                  <tr>
                    <td className="lbl" style={{ paddingTop: '4px' }}>MODE:</td>
                    <td className="val uppercase" style={{ paddingTop: '4px' }}>
                      {lastInvoice.paymentMethod === 'cash' ? 'CASH' :
                        lastInvoice.paymentMethod === 'mobile_money' ? 'MOB MONEY' :
                          lastInvoice.paymentMethod === 'card' ? 'CARTE' : 'DETTE'}
                    </td>
                  </tr>
                  {lastInvoice.paymentReference && (
                    <tr>
                      <td className="lbl">REF:</td>
                      <td className="val">{lastInvoice.paymentReference}</td>
                    </tr>
                  )}
                </tbody>
              </table>

              <hr />

              <p className="text-center italic font-black" style={{ fontSize: '11px', margin: '6px 0' }}>*** Merci de votre confiance ***</p>
              <p className="text-center font-bold" style={{ fontSize: '9px', opacity: 0.8 }}>{lastInvoice.id}</p>
            </div>
          )}
        </div>
      </div>

      {/* Patient Search */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un patient par nom, téléphone ou ID..."
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
                            // Auto-select primary or all active insurances
                            const IDs = patient.insurances?.map(i => i.insuranceId) || []
                            setSelectedInsuranceIds(IDs)
                          }}
                        >
                          <div className="bg-primary/10 p-2 rounded-full">
                            <User className="size-4 text-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground">
                              {patient.firstName} {patient.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {patient.phone} — #{patient.patientNumber}
                            </p>
                          </div>
                          <div className="flex items-center gap-1 ml-auto">
                            {patient.isCorporateEmployee && (
                              <Badge variant="outline" className="border-blue-500/30 bg-blue-500/5 text-blue-600 text-[10px] h-5">
                                Corporate
                              </Badge>
                            )}
                            {patient.isInsured && (
                              <Badge variant="outline" className="border-green-500/30 bg-green-500/5 text-green-600 text-[10px] h-5">
                                <Shield className="size-3 mr-1" />
                                Assuré
                              </Badge>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="p-4 text-sm text-muted-foreground text-center italic">Aucun patient trouvé</p>
                  )}
                </div>
              )}
            </div>
            <Button variant="outline" className="h-12 border-primary/20 bg-primary/10 text-primary hover:bg-primary/20 px-6 shrink-0" asChild>
              <Link href="/patients/new?redirect=/billing">
                <UserPlus className="size-4 mr-2" />
                Nouveau Patient
              </Link>
            </Button>
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
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">N° Patient</p>
                    <p className="font-medium">#{selectedPatient.patientNumber}</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded-md">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Genre</p>
                    <p className="font-medium capitalize">{selectedPatient.gender === 'male' ? 'Homme' : 'Femme'}</p>
                  </div>
                  <div className="bg-muted/50 p-2 rounded-md">
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider">Âge</p>
                    <p className="font-medium">{new Date().getFullYear() - new Date(selectedPatient.dateOfBirth).getFullYear()} ans</p>
                  </div>
                </div>

                {selectedPatient.isCorporateEmployee && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <label className="text-[10px] font-black uppercase text-muted-foreground ml-1 flex items-center gap-1">
                        Partenaire Corporate
                      </label>
                      {loadingPartnership ? (
                        <div className="flex items-center gap-2 p-2 text-xs text-muted-foreground">
                          <Loader2 className="size-3 animate-spin" />
                          Chargement...
                        </div>
                      ) : partnershipData ? (
                        <div className="bg-blue-500/5 border border-blue-200/30 rounded-lg p-3 space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-bold text-foreground">{partnershipData.partner.companyName}</span>
                            {partnershipData.rules.length > 0 && (
                              <Badge className="bg-blue-500/10 text-blue-600 border-blue-200/30 text-[9px] h-5">
                                {partnershipData.rules.length} règle{partnershipData.rules.length > 1 ? 's' : ''}
                              </Badge>
                            )}
                          </div>
                          {partnershipData.employee.position && (
                            <p className="text-[11px] text-muted-foreground">{partnershipData.employee.position}{partnershipData.employee.department ? ` — ${partnershipData.employee.department}` : ''}</p>
                          )}
                          <p className="text-[10px] font-mono text-muted-foreground">Matricule: {partnershipData.employee.employeeNumber}</p>
                          {partnershipData.rules.length > 0 && (
                            <div className="pt-1 border-t border-blue-200/20 mt-1">
                              <p className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Remise partenaire active</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="bg-muted/50 rounded-lg p-2">
                          <p className="text-xs text-muted-foreground">Aucune convention active</p>
                        </div>
                      )}
                    </div>
                  </>
                )}

                <Separator />

                <div className="space-y-3">
                  <label className="text-[10px] font-black uppercase text-muted-foreground ml-1">Insurances Sélectionnées</label>
                  {selectedPatient.insurances && selectedPatient.insurances.length > 0 ? (
                    <div className="space-y-2">
                      {selectedPatient.insurances.map((ins) => {
                        const isSelected = selectedInsuranceIds.includes(ins.insuranceId)
                        const isExpired = ins.insuranceExpiryDate && new Date(ins.insuranceExpiryDate) < new Date()

                        return (
                          <div
                            key={ins.id}
                            className={`relative border rounded-lg p-2 transition-all cursor-pointer ${isSelected
                              ? 'border-primary bg-primary/5 ring-1 ring-primary'
                              : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                              } ${isExpired ? 'opacity-70' : ''}`}
                            onClick={() => {
                              setSelectedInsuranceIds(prev =>
                                prev.includes(ins.insuranceId)
                                  ? prev.filter(id => id !== ins.insuranceId)
                                  : [...prev, ins.insuranceId]
                              )
                            }}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                {isSelected ? (
                                  <Shield className="size-4 text-primary" />
                                ) : (
                                  <ShieldOff className="size-4 text-muted-foreground" />
                                )}
                                <div>
                                  <p className="text-xs font-bold leading-none">{ins.insurance.name}</p>
                                  <p className="text-[9px] text-muted-foreground font-mono mt-0.5">{ins.insuranceNumber}</p>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <Badge variant={isSelected ? "default" : "outline"} className="text-[8px] h-4 px-1 leading-none uppercase">
                                  {ins.coverageRate}%
                                </Badge>
                                {isExpired && (
                                  <span className="text-[8px] text-destructive font-bold uppercase leading-none">Expiré</span>
                                )}
                              </div>
                            </div>
                          </div>
                        )
                      })}
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
                    <Button variant="outline" size="sm" onClick={() => handlePrint(lastInvoice)}>
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
                              <div className="flex items-center gap-2">
                                <span className={item.coverageSource === 'rule' ? 'text-primary font-bold' : 'text-slate-500'}>
                                  Part Mutuelle ({item.coverageRate}%): {item.insurancePart.toLocaleString()} FBU
                                </span>
                                <Badge
                                  variant="outline"
                                  className={`text-[8px] h-4 px-1 leading-none uppercase ${item.coverageSource === 'rule'
                                    ? 'border-primary/30 bg-primary/5 text-primary'
                                    : 'border-slate-300 bg-slate-50 text-slate-500'
                                    }`}
                                >
                                  {item.coverageSource === 'rule' ? 'Règle Spécifique' : 'Tarif Patient'}
                                </Badge>
                              </div>
                            )}
                            {item.partnershipDiscount > 0 && (
                              <div className="flex items-center gap-1">
                                <span className="text-blue-600 font-bold">
                                  -{item.partnershipDiscount.toLocaleString()} FBU Corporate
                                </span>
                              </div>
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
                    {/* <Button
                      variant={paymentMethod === 'card' ? 'default' : 'outline'}
                      className={`h-16 flex-col gap-1 ${paymentMethod === 'card' ? 'bg-primary border-primary' : ''}`}
                      onClick={() => setPaymentMethod('card')}
                    >
                      <CreditCard className="size-5" />
                      <span className="text-[10px] font-bold">CARTE</span>
                    </Button> */}
                    <Button
                      variant={paymentMethod === 'loan' ? 'default' : 'outline'}
                      className={`h-16 flex-col gap-1 ${paymentMethod === 'loan' ? 'bg-orange-600 border-orange-600 text-white' : 'border-orange-200 text-orange-600 hover:bg-orange-50'}`}
                      onClick={() => setPaymentMethod('loan')}
                    >
                      <HistoryIcon className="size-5" />
                      <span className="text-[10px] font-bold uppercase leading-none">DETTE / PRÊT</span>
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

                  {openSessions.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <label className="text-[10px] font-black text-muted-foreground uppercase ml-1 flex items-center gap-1">
                        <Landmark className="size-3" /> Caisse / Session
                      </label>
                      <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                        <SelectTrigger className="h-9 text-xs">
                          <SelectValue placeholder="Sélectionner une caisse" />
                        </SelectTrigger>
                        <SelectContent>
                          {openSessions.map((s: any) => (
                            <SelectItem key={s.id} value={s.id} className="text-xs">
                              {s.cashRegister?.name || 'Caisse'} — {new Date(s.openedAt).toLocaleString()}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-2 border-t border-dashed">
                    <label className="text-[10px] font-black text-orange-600 uppercase ml-1 flex items-center gap-1">
                      <Tag className="size-3" /> Accorder une Réduction (FBU)
                    </label>
                    <Input
                      type="number"
                      placeholder="Montant de la réduction..."
                      className="h-10 text-sm border-orange-200 focus:border-orange-400 focus:ring-orange-200"
                      value={discountAmount || ''}
                      onChange={(e) => setDiscountAmount(Math.max(0, Number(e.target.value)))}
                    />
                  </div>

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
                    {selectedInsuranceIds.length > 0 && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center text-xs text-primary pt-1">
                          <span className="font-medium">Total Assurances :</span>
                          <span className="font-bold">-{totals.insTotal.toLocaleString()} FBU</span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {selectedPatient.insurances
                            .filter(i => selectedInsuranceIds.includes(i.insuranceId))
                            .map(i => (
                              <Badge key={i.id} variant="secondary" className="text-[8px] h-4 bg-primary/10 text-primary border-none">
                                {i.insurance.name}
                              </Badge>
                            ))
                          }
                        </div>
                      </div>
                    )}
                    {totals.partnershipTotal > 0 && (
                      <div className="flex justify-between items-center text-xs text-blue-600 font-bold">
                        <span>Remise Corporate :</span>
                        <span>-{totals.partnershipTotal.toLocaleString()} FBU</span>
                      </div>
                    )}
                    {discountAmount > 0 && (
                      <div className="flex justify-between items-center text-xs text-orange-600 font-bold italic">
                        <span>Réduction manuelle :</span>
                        <span>-{discountAmount.toLocaleString()} FBU</span>
                      </div>
                    )}
                    <Separator className="bg-primary/10" />
                    <div className="flex justify-between items-baseline pt-1">
                      <span className="text-[10px] font-black uppercase text-slate-500">Net Patient :</span>
                      <div className="text-right">
                        <p className={`text-2xl font-black ${paymentMethod === 'loan' ? 'text-orange-600' : 'text-primary'} animate-in zoom-in duration-300`} key={`${discountAmount}-${totals.partnershipTotal}`}>
                          {(totals.patTotal - discountAmount).toLocaleString()}
                        </p>
                        <p className="text-[8px] font-bold text-muted-foreground">FRANC BURUNDAIS</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Button
                  className={`w-full h-14 font-black text-base shadow-2xl relative overflow-hidden group ${paymentMethod === 'loan' ? 'bg-orange-600 hover:bg-orange-700' : 'bg-slate-900 hover:bg-slate-800'
                    } text-white`}
                  disabled={items.length === 0 || isSubmitting || (paymentMethod === 'mobile_money' && !paymentReference)}
                  onClick={handleValidate}
                >
                  <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                  {isSubmitting ? (
                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Traitement...</>
                  ) : (
                    <>
                      {paymentMethod === 'loan' ? (
                        <><HistoryIcon className="mr-2 h-6 w-6" /> ENREGISTRER COMME DETTE</>
                      ) : (
                        <><Check className="mr-2 h-6 w-6 text-primary" /> ENREGISTRER & IMPRIMER</>
                      )}
                    </>
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
      )
      }
    </div >
  )
}
