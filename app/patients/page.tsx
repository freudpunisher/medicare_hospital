"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import {
  Plus, Shield, ShieldOff, Phone, Calendar, Receipt,
  Users, UserCheck, UserX, Heart, Search, AlertCircle,
  ChevronLeft, ChevronRight, ListFilter,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
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
import { cn } from "@/lib/utils"

interface Patient {
  id: string
  patientNumber: number
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  phone: string
  isInsured: boolean
  insuranceId: string | null
  insuranceNumber: string | null
  insuranceExpiryDate: string | null
  createdAt: string
}

interface Insurance {
  id: string
  name: string
  isActive: boolean
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

interface Stats {
  total: number
  males: number
  females: number
  insured: number
  uninsured: number
}

function formatGender(value: string) {
  if (value === "Male") return "Homme"
  if (value === "Female") return "Femme"
  if (value === "Other") return "Autre"
  return value
}

function calculateAge(dateOfBirth: string) {
  const birth = new Date(dateOfBirth)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export default function PatientsPage() {
  const [patientsData, setPatientsData] = useState<Patient[]>([])
  const [insurances, setInsurances] = useState<Insurance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<Stats>({ total: 0, males: 0, females: 0, insured: 0, uninsured: 0 })

  const [filter, setFilter] = useState<"all" | "insured" | "uninsured">("all")
  const [genderFilter, setGenderFilter] = useState<"all" | "male" | "female">("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchPatients()
  }, [filter, genderFilter, search, page, limit])

  useEffect(() => {
    fetchInsurances()
  }, [])

  async function fetchPatients() {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({
        filter,
        gender: genderFilter,
        search,
        page: String(page),
        limit: String(limit),
      })
      const res = await fetch(`/api/patients/list?${params}`)
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || "Impossible de charger les patients")
        return
      }
      setPatientsData(data.data || [])
      if (data.stats) setStats(data.stats)
      if (data.pagination) setPagination(data.pagination)
    } catch (err) {
      setError("Impossible de charger les patients")
    } finally {
      setLoading(false)
    }
  }

  async function fetchInsurances() {
    try {
      const res = await fetch("/api/insurances/list?active=true")
      const data = await res.json()
      if (res.ok) {
        setInsurances(data.data || [])
      }
    } catch (err) {
      // Keep silent
    }
  }

  const expiredCount = useMemo(() => {
    return patientsData.filter((p) => {
      if (!p.insuranceExpiryDate) return false
      return new Date(p.insuranceExpiryDate) < new Date()
    }).length
  }, [patientsData])

  return (
    <div className="p-6 space-y-6  mx-auto">
      <PageHeader title="Patients" description="Gérer les dossiers des patients">
        <Button asChild size="sm" className="rounded-full shadow-md px-5 font-bold">
          <Link href="/patients/new">
            <Plus className="size-4 mr-2" />
            Nouveau patient
          </Link>
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
              <Users className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black leading-none">{stats.total}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-blue-500/5 to-blue-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600 shrink-0">
              <Heart className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black text-blue-600 leading-none">{stats.males}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Hommes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-pink-500/5 to-pink-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-600 shrink-0">
              <Heart className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black text-pink-600 leading-none">{stats.females}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Femmes</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-emerald-500/5 to-emerald-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 shrink-0">
              <UserCheck className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black text-emerald-600 leading-none">{stats.insured}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Assurés</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-orange-500/5 to-orange-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-600 shrink-0">
              <UserX className="size-5" />
            </div>
            <div className="min-w-0">
              <p className="text-2xl font-black text-orange-600 leading-none">{stats.uninsured}</p>
              <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Non assurés</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, téléphone ou ID..."
            className="pl-11 h-11 rounded-2xl border-muted/50 bg-card/50 focus:ring-primary/20"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
          />
        </div>
        <Select
          value={filter}
          onValueChange={(v) => {
            setFilter(v as typeof filter)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-44 h-11 rounded-2xl border-muted/50 bg-card/50">
            <ListFilter className="size-4 mr-2 shrink-0" />
            <SelectValue placeholder="Assurance" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="insured">Assurés</SelectItem>
            <SelectItem value="uninsured">Non assurés</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={genderFilter}
          onValueChange={(v) => {
            setGenderFilter(v as typeof genderFilter)
            setPage(1)
          }}
        >
          <SelectTrigger className="w-full sm:w-40 h-11 rounded-2xl border-muted/50 bg-card/50">
            <SelectValue placeholder="Sexe" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="male">Hommes</SelectItem>
            <SelectItem value="female">Femmes</SelectItem>
          </SelectContent>
        </Select>
        <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-28 h-11 rounded-2xl border-muted/50 bg-card/50">
            <SelectValue placeholder="10 / page" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="10">10 / page</SelectItem>
            <SelectItem value="20">20 / page</SelectItem>
            <SelectItem value="50">50 / page</SelectItem>
            <SelectItem value="100">100 / page</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="size-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <p className="text-muted-foreground font-bold text-sm animate-pulse">Chargement des patients...</p>
            </div>
          ) : error ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <AlertCircle className="size-12 text-destructive/60" />
              <p className="text-destructive font-bold">{error}</p>
              <Button variant="outline" className="rounded-full font-bold" onClick={fetchPatients}>
                Réessayer
              </Button>
            </div>
          ) : patientsData.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-6">
              <div className="size-20 rounded-[2rem] bg-muted/30 flex items-center justify-center text-muted-foreground/40 border-2 border-dashed border-muted-foreground/20">
                {search || filter !== "all" || genderFilter !== "all" ? (
                  <AlertCircle className="size-10" />
                ) : (
                  <Users className="size-10" />
                )}
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-black tracking-tight">
                  {search || filter !== "all" || genderFilter !== "all"
                    ? "Aucun résultat"
                    : "Aucun patient"}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {search || filter !== "all" || genderFilter !== "all"
                    ? "Aucun patient ne correspond à vos critères."
                    : "Aucun patient n'est encore enregistré dans le système."}
                </p>
              </div>
              {search || filter !== "all" || genderFilter !== "all" ? (
                <Button
                  variant="outline"
                  className="rounded-full font-black text-xs uppercase"
                  onClick={() => { setSearch(""); setFilter("all"); setGenderFilter("all"); setPage(1) }}
                >
                  Réinitialiser les filtres
                </Button>
              ) : (
                <Button asChild variant="outline" className="rounded-full font-black text-xs uppercase">
                  <Link href="/patients/new">Ajouter votre premier patient</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest py-5">ID</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Patient</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Sexe</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Âge</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Téléphone</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Assurance</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Expiration</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Inscription</TableHead>
                      <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-widest py-5">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {patientsData.map((patient) => {
                      const ins = insurances.find((i) => i.id === patient.insuranceId)
                      const age = calculateAge(patient.dateOfBirth)
                      const isExpired = patient.insuranceExpiryDate && new Date(patient.insuranceExpiryDate) < new Date()
                      return (
                        <TableRow key={patient.id} className="group hover:bg-muted/40 transition-colors border-muted/50">
                          <TableCell className="pl-8 py-4">
                            <Badge variant="outline" className="font-black text-xs px-2 py-0.5 bg-muted/30 font-mono">
                              #{patient.patientNumber}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "size-10 rounded-full flex items-center justify-center text-sm font-black border shadow-sm",
                                patient.gender === "Male"
                                  ? "bg-blue-500/10 text-blue-600 border-blue-500/20"
                                  : "bg-pink-500/10 text-pink-600 border-pink-500/20"
                              )}>
                                {patient.firstName.charAt(0)}{patient.lastName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-foreground leading-tight">
                                  {patient.firstName} {patient.lastName}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="text-sm text-muted-foreground font-medium">
                              {formatGender(patient.gender)}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="size-3.5" />
                              <span className="text-sm">{age} ans</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Phone className="size-3.5 shrink-0" />
                              <span className="text-sm">{patient.phone}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            {patient.isInsured ? (
                              <Badge
                                variant="outline"
                                className={cn(
                                  "border-primary/30 bg-primary/5 text-primary text-[10px] font-bold px-2.5 py-1",
                                  isExpired && "border-orange-300 bg-orange-50 text-orange-600"
                                )}
                              >
                                <Shield className="size-3 mr-1" />
                                {ins?.name ?? "Assuré"}
                              </Badge>
                            ) : (
                              <Badge
                                variant="outline"
                                className="border-muted-foreground/30 text-muted-foreground text-[10px] font-bold px-2.5 py-1"
                              >
                                <ShieldOff className="size-3 mr-1" />
                                Non assuré
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            {patient.insuranceExpiryDate ? (
                              <span className={cn(
                                "text-xs font-medium",
                                isExpired ? "text-destructive" : "text-muted-foreground"
                              )}>
                                {new Date(patient.insuranceExpiryDate).toLocaleDateString("fr-FR")}
                                {isExpired && <span className="ml-1 text-[9px] font-bold uppercase text-destructive">Expiré</span>}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="py-4">
                            <span className="text-xs text-muted-foreground">
                              {new Date(patient.createdAt).toLocaleDateString("fr-FR")}
                            </span>
                          </TableCell>
                          <TableCell className="text-right pr-8 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="rounded-full size-9 hover:bg-primary/10 hover:text-primary" asChild title="Détails">
                                <Link href={`/patients/${patient.id}`}>
                                  <Users className="size-4" />
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" className="rounded-full size-9 hover:bg-amber-500/10 hover:text-amber-600" asChild title="Modifier">
                                <Link href={`/patients/${patient.id}/edit`}>
                                  <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                  </svg>
                                </Link>
                              </Button>
                              <Button variant="ghost" size="icon" className="rounded-full size-9 hover:bg-emerald-500/10 hover:text-emerald-600" asChild title="Facture">
                                <Link href={`/billing?patientId=${patient.id}`}>
                                  <Receipt className="size-4" />
                                </Link>
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* Footer */}
              <div className="px-8 py-4 border-t border-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/10">
                <p className="text-[11px] font-bold text-muted-foreground">
                  Affichage {(pagination.page - 1) * pagination.limit + 1} à{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} sur{" "}
                  {pagination.total} patients
                </p>
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5 text-[10px]">
                    <Badge variant="outline" className="rounded-full text-[9px] font-bold px-2.5 border-green-500/30 text-green-600 bg-green-50">
                      {stats.insured} assurés
                    </Badge>
                    <Badge variant="outline" className="rounded-full text-[9px] font-bold px-2.5 border-orange-500/30 text-orange-600 bg-orange-50">
                      {expiredCount > 0 && `${expiredCount} expirés`}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full size-8"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled className="rounded-full font-bold text-xs px-3 min-w-[60px]">
                      {pagination.page} / {pagination.totalPages || 1}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="rounded-full size-8"
                      disabled={page === pagination.totalPages || pagination.totalPages === 0}
                      onClick={() => setPage(page + 1)}
                    >
                      <ChevronRight className="size-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
