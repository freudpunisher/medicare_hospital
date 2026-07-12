"use client"

import { useEffect, useState, useMemo } from "react"
import Link from "next/link"
import {
  Plus, ClipboardList, Clock, CheckCircle2, AlertCircle, XCircle,
  Calendar, Search, User, Stethoscope, Loader2, ChevronLeft, ChevronRight,
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

interface Consultation {
  id: string
  consultationNumber: string
  consultationType: string
  status: string
  visitDate: string
  chiefComplaint: string | null
  patient: {
    id: string
    firstName: string
    lastName: string
    patientNumber: number
    gender: string
  }
  doctor: {
    id: string
    fullName: string | null
  }
}

interface Stats {
  total: number
  today: number
  thisWeek: number
  pending: number
  completed: number
  cancelled: number
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

const statusLabels: Record<string, { label: string; className: string }> = {
  waiting: { label: "En attente", className: "bg-amber-500/10 text-amber-600 border-amber-200" },
  in_consultation: { label: "En cours", className: "bg-blue-500/10 text-blue-600 border-blue-200" },
  in_exam: { label: "En examen", className: "bg-purple-500/10 text-purple-600 border-purple-200" },
  in_lab: { label: "Au labo", className: "bg-cyan-500/10 text-cyan-600 border-cyan-200" },
  in_radiology: { label: "Radio", className: "bg-indigo-500/10 text-indigo-600 border-indigo-200" },
  in_pharmacy: { label: "Pharmacie", className: "bg-pink-500/10 text-pink-600 border-pink-200" },
  hospitalized: { label: "Hospitalisé", className: "bg-orange-500/10 text-orange-600 border-orange-200" },
  completed: { label: "Terminée", className: "bg-green-500/10 text-green-600 border-green-200" },
  cancelled: { label: "Annulée", className: "bg-red-500/10 text-red-600 border-red-200" },
}

const typeLabels: Record<string, string> = {
  general: "Générale",
  pediatric: "Pédiatrique",
  ophthalmology: "Ophtalmologique",
  gynecology: "Gynécologique",
}

export default function ConsultationsPage() {
  const [data, setData] = useState<Consultation[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<Stats>({ total: 0, today: 0, thisWeek: 0, pending: 0, completed: 0, cancelled: 0 })

  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")
  const [page, setPage] = useState(1)
  const [limit, setLimit] = useState(10)
  const [pagination, setPagination] = useState<PaginationInfo>({ page: 1, limit: 10, total: 0, totalPages: 0 })

  useEffect(() => { fetchConsultations() }, [search, statusFilter, typeFilter, page, limit])

  async function fetchConsultations() {
    setLoading(true)
    try {
      const params = new URLSearchParams({ search, status: statusFilter, type: typeFilter, page: String(page), limit: String(limit) })
      const res = await fetch(`/api/consultations/list?${params}`)
      const result = await res.json()
      if (result.success) {
        setData(result.data)
        if (result.stats) setStats(result.stats)
        if (result.pagination) setPagination(result.pagination)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const activeCount = useMemo(() => data.filter(d => d.status !== "completed" && d.status !== "cancelled").length, [data])

  return (
    <div className="p-6 space-y-6  mx-auto">
      <PageHeader title="Consultations" description="Gérer les consultations et visites médicales">
        <Button asChild size="sm" className="rounded-full shadow-md px-5 font-bold">
          <Link href="/consultations/new">
            <Plus className="size-4 mr-2" />
            Nouvelle Consultation
          </Link>
        </Button>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><ClipboardList className="size-5" /></div>
            <div><p className="text-2xl font-black leading-none">{stats.total}</p><p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Total</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-sky-500/5 to-sky-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-sky-500/10 flex items-center justify-center text-sky-600 shrink-0"><Calendar className="size-5" /></div>
            <div><p className="text-2xl font-black text-sky-600 leading-none">{stats.today}</p><p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Aujourd'hui</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-violet-500/5 to-violet-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-violet-500/10 flex items-center justify-center text-violet-600 shrink-0"><Clock className="size-5" /></div>
            <div><p className="text-2xl font-black text-violet-600 leading-none">{stats.thisWeek}</p><p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Cette semaine</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-amber-500/5 to-amber-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0"><Loader2 className="size-5" /></div>
            <div><p className="text-2xl font-black text-amber-600 leading-none">{stats.pending}</p><p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mt-1">En cours</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600 shrink-0"><CheckCircle2 className="size-5" /></div>
            <div><p className="text-2xl font-black text-green-600 leading-none">{stats.completed}</p><p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Terminées</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-red-500/5 to-red-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-red-500/10 flex items-center justify-center text-red-600 shrink-0"><XCircle className="size-5" /></div>
            <div><p className="text-2xl font-black text-red-600 leading-none">{stats.cancelled}</p><p className="text-[8px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Annulées</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par n° consultation, patient ou médecin..."
            className="pl-11 h-11 rounded-2xl border-muted/50 bg-card/50 focus:ring-primary/20"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-40 h-11 rounded-2xl border-muted/50 bg-card/50">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(statusLabels).map(([value, { label }]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-44 h-11 rounded-2xl border-muted/50 bg-card/50">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(typeLabels).map(([value, label]) => (
              <SelectItem key={value} value={value}>{label}</SelectItem>
            ))}
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
          </SelectContent>
        </Select>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="size-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <p className="text-muted-foreground font-bold text-sm animate-pulse">Chargement des consultations...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-6">
              <div className="size-20 rounded-[2rem] bg-muted/30 flex items-center justify-center text-muted-foreground/40 border-2 border-dashed border-muted-foreground/20">
                <ClipboardList className="size-10" />
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-black tracking-tight">Aucune consultation</h3>
                <p className="text-sm text-muted-foreground mt-1">Aucune consultation trouvée pour les critères sélectionnés.</p>
              </div>
              {search || statusFilter !== "all" || typeFilter !== "all" ? (
                <Button variant="outline" className="rounded-full font-black text-xs uppercase" onClick={() => { setSearch(""); setStatusFilter("all"); setTypeFilter("all"); setPage(1) }}>
                  Réinitialiser les filtres
                </Button>
              ) : (
                <Button asChild variant="outline" className="rounded-full font-black text-xs uppercase">
                  <Link href="/consultations/new">Démarrer une consultation</Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest py-5">N° Consultation</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Patient</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Médecin</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Date</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Type</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Motif</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Statut</TableHead>
                      <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-widest py-5">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.map((c) => {
                      const st = statusLabels[c.status] || statusLabels.waiting
                      return (
                        <TableRow key={c.id} className="group hover:bg-muted/40 transition-colors border-muted/50">
                          <TableCell className="pl-8 py-4">
                            <Badge variant="outline" className="font-mono font-black text-[11px] px-2 py-0.5 bg-muted/30">
                              {c.consultationNumber}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "size-9 rounded-full flex items-center justify-center text-xs font-black border",
                                c.patient.gender === "Male" ? "bg-blue-500/10 text-blue-600 border-blue-500/20" : "bg-pink-500/10 text-pink-600 border-pink-500/20"
                              )}>
                                {c.patient.firstName.charAt(0)}{c.patient.lastName.charAt(0)}
                              </div>
                              <div>
                                <p className="font-bold text-sm leading-tight">{c.patient.firstName} {c.patient.lastName}</p>
                                <p className="text-[10px] text-muted-foreground">#{c.patient.patientNumber}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              <Stethoscope className="size-3.5 text-muted-foreground shrink-0" />
                              <span className="text-sm">Dr. {c.doctor.fullName || "N/A"}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                              <Calendar className="size-3.5 shrink-0" />
                              <span className="text-sm">{new Date(c.visitDate).toLocaleDateString("fr-FR")}</span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant="outline" className="rounded-full text-[10px] font-bold px-2.5 py-1 border-primary/20 bg-primary/5 text-primary">
                              {typeLabels[c.consultationType] || c.consultationType}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 max-w-[200px]">
                            <p className="text-sm text-muted-foreground truncate">{c.chiefComplaint || "-"}</p>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge variant="outline" className={cn("rounded-full text-[9px] font-bold px-2.5 py-1 uppercase", st.className)}>
                              {st.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right pr-8 py-4">
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" className="rounded-full size-9 hover:bg-primary/10 hover:text-primary" asChild title="Détails">
                                <Link href={`/consultations/${c.id}`}>
                                  <ClipboardList className="size-4" />
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

              <div className="px-8 py-4 border-t border-muted/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-muted/10">
                <p className="text-[11px] font-bold text-muted-foreground">
                  Affichage {(pagination.page - 1) * pagination.limit + 1} à{" "}
                  {Math.min(pagination.page * pagination.limit, pagination.total)} sur {pagination.total} consultations
                </p>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="rounded-full text-[9px] font-bold px-2.5 border-amber-500/30 text-amber-600 bg-amber-50">
                    {activeCount} en cours
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Button variant="outline" size="icon" className="rounded-full size-8" disabled={page === 1} onClick={() => setPage(page - 1)}>
                      <ChevronLeft className="size-4" />
                    </Button>
                    <Button variant="outline" size="sm" disabled className="rounded-full font-bold text-xs px-3 min-w-[60px]">
                      {pagination.page} / {pagination.totalPages || 1}
                    </Button>
                    <Button variant="outline" size="icon" className="rounded-full size-8" disabled={page === pagination.totalPages || pagination.totalPages === 0} onClick={() => setPage(page + 1)}>
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
