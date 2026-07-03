"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { Plus, Loader2, Building2, ArrowLeft, Pencil, Calendar, Phone, Mail, Globe, MapPin, Hash, CreditCard, Users, FileText, ClipboardList, Eye } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { toast } from "sonner"

interface Partner {
  id: string
  companyName: string
  registrationNumber: string | null
  taxId: string | null
  contactPerson: string | null
  contactEmail: string | null
  contactPhone: string | null
  address: string | null
  website: string | null
  isActive: boolean
  partnershipStartDate: string
  partnershipEndDate: string | null
  autoRenew: boolean
  notes: string | null
  createdAt: string
  updatedAt: string
}

interface Employee {
  id: string
  employeeNumber: string
  patientName: string | null
  department: string | null
  position: string | null
  isActive: boolean
}

interface Agreement {
  id: string
  agreementNumber: string
  agreementType: string
  effectiveDate: string
  expiryDate: string | null
  isActive: boolean
}

interface VisitLog {
  id: string
  date: string
  employeeName: string
  visitId: string
  originalTotal: number
  discountApplied: number
  finalTotal: number
}

interface Patient {
  id: string
  firstName: string
  lastName: string
}

const AGREEMENT_TYPES: Record<string, string> = {
  discount: "Remise",
  flat_rate: "Tarif Forfaitaire",
  capped: "Plafonné",
}

function formatDate(dateStr: string | null) {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("fr-FR")
}

export default function PartnerDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [partner, setPartner] = useState<Partner | null>(null)
  const [loading, setLoading] = useState(true)

  const [employees, setEmployees] = useState<Employee[]>([])
  const [employeesLoading, setEmployeesLoading] = useState(true)
  const [empOpen, setEmpOpen] = useState(false)
  const [empSubmitting, setEmpSubmitting] = useState(false)
  const [patients, setPatients] = useState<Patient[]>([])
  const [empForm, setEmpForm] = useState({ patientId: "", employeeNumber: "", department: "", position: "", hireDate: "" })

  const [agreements, setAgreements] = useState<Agreement[]>([])
  const [agreementsLoading, setAgreementsLoading] = useState(true)

  const [visitLogs, setVisitLogs] = useState<VisitLog[]>([])
  const [visitLogsLoading, setVisitLogsLoading] = useState(true)

  const [employeesExpanded, setEmployeesExpanded] = useState(true)
  const [agreementsExpanded, setAgreementsExpanded] = useState(true)
  const [visitsExpanded, setVisitsExpanded] = useState(true)

  useEffect(() => {
    fetchPartner()
    fetchEmployees()
    fetchAgreements()
    fetchVisitLogs()
    fetchPatients()
  }, [])

  async function fetchPartner() {
    try {
      const res = await fetch(`/api/partners/${id}`)
      const result = await res.json()
      if (res.ok && result.success) {
        setPartner(result.data)
      } else {
        toast.error(result.error || "Erreur lors du chargement du partenaire")
      }
    } catch (err) {
      toast.error("Impossible de se connecter au serveur")
    } finally {
      setLoading(false)
    }
  }

  async function fetchEmployees() {
    setEmployeesLoading(true)
    try {
      const res = await fetch(`/api/partners/employees/list?partnerId=${id}`)
      const result = await res.json()
      if (res.ok && result.success) {
        setEmployees(result.data)
      }
    } catch (err) {
      // silent
    } finally {
      setEmployeesLoading(false)
    }
  }

  async function fetchAgreements() {
    setAgreementsLoading(true)
    try {
      const res = await fetch(`/api/partners/agreements/list?partnerId=${id}`)
      const result = await res.json()
      if (res.ok && result.success) {
        setAgreements(result.data)
      }
    } catch (err) {
      // silent
    } finally {
      setAgreementsLoading(false)
    }
  }

  async function fetchVisitLogs() {
    setVisitLogsLoading(true)
    try {
      const res = await fetch(`/api/partners/visit-logs/list?partnerId=${id}&limit=5`)
      const result = await res.json()
      if (res.ok && result.success) {
        setVisitLogs(result.data)
      }
    } catch (err) {
      // silent
    } finally {
      setVisitLogsLoading(false)
    }
  }

  async function fetchPatients() {
    try {
      const res = await fetch("/api/patients/list")
      const result = await res.json()
      if (res.ok && result.success) {
        setPatients(result.data)
      }
    } catch (err) {
      // silent
    }
  }

  async function handleAddEmployee() {
    if (!empForm.patientId || !empForm.employeeNumber) return
    setEmpSubmitting(true)
    try {
      const res = await fetch("/api/partners/employees/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          partnerId: id,
          ...empForm,
          hireDate: empForm.hireDate || null,
        }),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success("Employé ajouté avec succès")
        setEmpOpen(false)
        setEmpForm({ patientId: "", employeeNumber: "", department: "", position: "", hireDate: "" })
        fetchEmployees()
      } else {
        toast.error(result.error || "Erreur lors de l'ajout")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    } finally {
      setEmpSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="p-20 text-center flex flex-col items-center gap-4">
          <Loader2 className="size-10 animate-spin text-primary opacity-50" />
          <p className="text-muted-foreground font-bold text-sm animate-pulse">Chargement du partenaire...</p>
        </div>
      </div>
    )
  }

  if (!partner) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <Card className="rounded-[2.5rem] border-none shadow-sm bg-card/60 backdrop-blur-xl">
          <CardContent className="p-20 text-center">
            <p className="text-muted-foreground font-bold">Partenaire introuvable</p>
            <Button variant="outline" className="rounded-full font-black mt-4" asChild>
              <Link href="/partners">Retour aux partenaires</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader
        title={partner.companyName}
        description="Détails de l'entreprise partenaire"
      >
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" className="rounded-full font-bold" asChild>
            <Link href="/partners">
              <ArrowLeft className="size-4 mr-2" />
              Retour
            </Link>
          </Button>
          <Button size="sm" className="rounded-full shadow-md px-5 font-bold" asChild>
            <Link href={`/partners/${id}/edit`}>
              <Pencil className="size-4 mr-2" />
              Modifier
            </Link>
          </Button>
        </div>
      </PageHeader>

      <Card className="rounded-[2.5rem] border-none shadow-sm bg-card/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-lg font-black">Informations Générales</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Raison Sociale</p>
              <p className="font-black text-base flex items-center gap-2">
                <Building2 className="size-4 text-muted-foreground/50" />
                {partner.companyName}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">N° Enregistrement</p>
              <p className="text-sm font-medium flex items-center gap-2">
                <Hash className="size-4 text-muted-foreground/50" />
                {partner.registrationNumber || <span className="opacity-30 italic">—</span>}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">N° Fiscal</p>
              <p className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="size-4 text-muted-foreground/50" />
                {partner.taxId || <span className="opacity-30 italic">—</span>}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Personne de contact</p>
              <p className="text-sm font-medium flex items-center gap-2">
                <Users className="size-4 text-muted-foreground/50" />
                {partner.contactPerson || <span className="opacity-30 italic">—</span>}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Email</p>
              <p className="text-sm font-medium flex items-center gap-2">
                <Mail className="size-4 text-muted-foreground/50" />
                {partner.contactEmail || <span className="opacity-30 italic">—</span>}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Téléphone</p>
              <p className="text-sm font-medium flex items-center gap-2">
                <Phone className="size-4 text-muted-foreground/50" />
                {partner.contactPhone || <span className="opacity-30 italic">—</span>}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Site web</p>
              <p className="text-sm font-medium flex items-center gap-2">
                <Globe className="size-4 text-muted-foreground/50" />
                {partner.website ? (
                  <a href={partner.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">{partner.website}</a>
                ) : <span className="opacity-30 italic">—</span>}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Adresse</p>
              <p className="text-sm font-medium flex items-center gap-2">
                <MapPin className="size-4 text-muted-foreground/50" />
                {partner.address || <span className="opacity-30 italic">—</span>}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Statut</p>
              <StatusBadge active={partner.isActive} />
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Début de partenariat</p>
              <p className="text-sm font-medium flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground/50" />
                {formatDate(partner.partnershipStartDate)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Fin de partenariat</p>
              <p className="text-sm font-medium flex items-center gap-2">
                <Calendar className="size-4 text-muted-foreground/50" />
                {formatDate(partner.partnershipEndDate)}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Renouvellement auto.</p>
              <Badge variant={partner.autoRenew ? "default" : "outline"} className="rounded-full font-black text-[10px] px-3 py-1">
                {partner.autoRenew ? "Oui" : "Non"}
              </Badge>
            </div>
          </div>
          {partner.notes && (
            <div className="mt-6 p-4 rounded-2xl bg-muted/20 border border-muted/30">
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Notes</p>
              <p className="text-sm font-medium text-muted-foreground">{partner.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employés */}
      <Card className="rounded-[2.5rem] border-none shadow-sm bg-card/60 backdrop-blur-xl overflow-hidden">
        <button
          onClick={() => setEmployeesExpanded(!employeesExpanded)}
          className="w-full text-left"
        >
          <CardHeader className="flex flex-row items-center justify-between hover:bg-muted/20 transition-colors">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <Users className="size-5 text-primary" />
              Employés
              {!employeesLoading && (
                <Badge variant="outline" className="rounded-full font-black text-[10px] px-2.5 py-0.5 ml-2 bg-background/50 border-muted/50">
                  {employees.length}
                </Badge>
              )}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Dialog open={empOpen} onOpenChange={setEmpOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="ghost" className="rounded-full font-bold" onClick={(e) => e.stopPropagation()}>
                    <Plus className="size-4 mr-1" />
                    Ajouter
                  </Button>
                </DialogTrigger>
                <DialogContent className="rounded-[2.5rem] border-none shadow-2xl backdrop-blur-xl bg-card/95">
                  <DialogHeader>
                    <DialogTitle className="text-2xl font-black">Ajouter un Employé</DialogTitle>
                    <DialogDescription>Enregistrez un employé de {partner.companyName}.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-6 py-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Patient</Label>
                      <Select
                        value={empForm.patientId}
                        onValueChange={(v) => setEmpForm((f) => ({ ...f, patientId: v }))}
                      >
                        <SelectTrigger className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20">
                          <SelectValue placeholder="Sélectionnez un patient" />
                        </SelectTrigger>
                        <SelectContent className="rounded-2xl border-none shadow-xl">
                          {patients.map((p) => (
                            <SelectItem key={p.id} value={p.id}>{p.firstName} {p.lastName}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">N° Employé</Label>
                      <Input
                        placeholder="ex: EMP-001"
                        className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                        value={empForm.employeeNumber}
                        onChange={(e) => setEmpForm((f) => ({ ...f, employeeNumber: e.target.value }))}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Département</Label>
                        <Input
                          placeholder="ex: RH"
                          className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                          value={empForm.department}
                          onChange={(e) => setEmpForm((f) => ({ ...f, department: e.target.value }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Poste</Label>
                        <Input
                          placeholder="ex: Infirmier"
                          className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                          value={empForm.position}
                          onChange={(e) => setEmpForm((f) => ({ ...f, position: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Date d'embauche</Label>
                      <Input
                        type="date"
                        className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                        value={empForm.hireDate}
                        onChange={(e) => setEmpForm((f) => ({ ...f, hireDate: e.target.value }))}
                      />
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="ghost" onClick={() => setEmpOpen(false)} className="rounded-full font-bold">Annuler</Button>
                    <Button onClick={handleAddEmployee} disabled={empSubmitting || !empForm.patientId || !empForm.employeeNumber} className="rounded-full font-black px-8 shadow-lg">
                      {empSubmitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                      Créer l'Employé
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
        </button>
        {employeesExpanded && (
          <CardContent className="p-0 border-t border-muted/30">
            {employeesLoading ? (
              <div className="p-10 text-center">
                <Loader2 className="size-6 animate-spin text-primary opacity-50 mx-auto" />
                <p className="text-muted-foreground font-bold text-xs mt-2 animate-pulse">Chargement...</p>
              </div>
            ) : employees.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm text-muted-foreground font-medium">Aucun employé enregistré pour ce partenaire.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest py-4">N° Employé</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Patient</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Département</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Poste</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employees.map((emp) => (
                    <TableRow key={emp.id} className="hover:bg-muted/20 transition-colors border-muted/30">
                      <TableCell className="pl-8 py-3">
                        <p className="font-black text-sm">{emp.employeeNumber}</p>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="text-xs font-medium">{emp.patientName || <span className="opacity-30 italic">—</span>}</p>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="text-xs text-muted-foreground">{emp.department || <span className="opacity-30 italic">—</span>}</p>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="text-xs text-muted-foreground">{emp.position || <span className="opacity-30 italic">—</span>}</p>
                      </TableCell>
                      <TableCell className="py-3">
                        <StatusBadge active={emp.isActive} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        )}
      </Card>

      {/* Conventions */}
      <Card className="rounded-[2.5rem] border-none shadow-sm bg-card/60 backdrop-blur-xl overflow-hidden">
        <button
          onClick={() => setAgreementsExpanded(!agreementsExpanded)}
          className="w-full text-left"
        >
          <CardHeader className="flex flex-row items-center justify-between hover:bg-muted/20 transition-colors">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <FileText className="size-5 text-primary" />
              Conventions
              {!agreementsLoading && (
                <Badge variant="outline" className="rounded-full font-black text-[10px] px-2.5 py-0.5 ml-2 bg-background/50 border-muted/50">
                  {agreements.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
        </button>
        {agreementsExpanded && (
          <CardContent className="p-0 border-t border-muted/30">
            {agreementsLoading ? (
              <div className="p-10 text-center">
                <Loader2 className="size-6 animate-spin text-primary opacity-50 mx-auto" />
                <p className="text-muted-foreground font-bold text-xs mt-2 animate-pulse">Chargement...</p>
              </div>
            ) : agreements.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm text-muted-foreground font-medium">Aucune convention associée à ce partenaire.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest py-4">N° Convention</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Type</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Date d'effet</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Expiration</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Statut</TableHead>
                    <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-widest py-4">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agreements.map((agr) => (
                    <TableRow key={agr.id} className="hover:bg-muted/20 transition-colors border-muted/30">
                      <TableCell className="pl-8 py-3">
                        <p className="font-black text-sm">{agr.agreementNumber}</p>
                      </TableCell>
                      <TableCell className="py-3">
                        <Badge variant="outline" className="rounded-full font-black text-[10px] px-2.5 py-0.5 bg-background/50 border-muted/50">
                          {AGREEMENT_TYPES[agr.agreementType] || agr.agreementType}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="text-xs font-medium">{formatDate(agr.effectiveDate)}</p>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="text-xs text-muted-foreground">{formatDate(agr.expiryDate)}</p>
                      </TableCell>
                      <TableCell className="py-3">
                        <StatusBadge active={agr.isActive} />
                      </TableCell>
                      <TableCell className="text-right pr-8 py-3">
                        <Button variant="ghost" size="icon" className="rounded-full size-8" asChild>
                          <Link href={`/partners/agreements/${agr.id}`}>
                            <Eye className="size-4" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        )}
      </Card>

      {/* Visites Récentes */}
      <Card className="rounded-[2.5rem] border-none shadow-sm bg-card/60 backdrop-blur-xl overflow-hidden">
        <button
          onClick={() => setVisitsExpanded(!visitsExpanded)}
          className="w-full text-left"
        >
          <CardHeader className="flex flex-row items-center justify-between hover:bg-muted/20 transition-colors">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <ClipboardList className="size-5 text-primary" />
              Visites Récentes
              {!visitLogsLoading && (
                <Badge variant="outline" className="rounded-full font-black text-[10px] px-2.5 py-0.5 ml-2 bg-background/50 border-muted/50">
                  {visitLogs.length}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
        </button>
        {visitsExpanded && (
          <CardContent className="p-0 border-t border-muted/30">
            {visitLogsLoading ? (
              <div className="p-10 text-center">
                <Loader2 className="size-6 animate-spin text-primary opacity-50 mx-auto" />
                <p className="text-muted-foreground font-bold text-xs mt-2 animate-pulse">Chargement...</p>
              </div>
            ) : visitLogs.length === 0 ? (
              <div className="p-10 text-center">
                <p className="text-sm text-muted-foreground font-medium">Aucune visite récente pour ce partenaire.</p>
              </div>
            ) : (
              <Table>
                <TableHeader className="bg-muted/20">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest py-4">Date</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Employé</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Visite</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Original</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Remise</TableHead>
                    <TableHead className="font-black text-[10px] uppercase tracking-widest py-4">Final</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visitLogs.map((v) => (
                    <TableRow key={v.id} className="hover:bg-muted/20 transition-colors border-muted/30">
                      <TableCell className="pl-8 py-3">
                        <p className="text-xs font-medium">{formatDate(v.date)}</p>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="text-xs font-medium">{v.employeeName}</p>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="text-xs font-mono text-muted-foreground">{v.visitId}</p>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="text-xs font-medium">{v.originalTotal.toLocaleString()} FCFA</p>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="text-xs font-medium text-green-600">-{v.discountApplied.toLocaleString()} FCFA</p>
                      </TableCell>
                      <TableCell className="py-3">
                        <p className="text-xs font-black">{v.finalTotal.toLocaleString()} FCFA</p>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        )}
      </Card>
    </div>
  )
}
