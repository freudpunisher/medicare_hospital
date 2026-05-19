"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Plus, Shield, ShieldOff, Phone, Calendar } from "lucide-react"
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

interface Patient {
  id: string
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

function formatGender(value: string) {
  if (value === "Male") return "Homme"
  if (value === "Female") return "Femme"
  if (value === "Other") return "Autre"
  return value
}

export default function PatientsPage() {
  const [patientsData, setPatientsData] = useState<Patient[]>([])
  const [insurances, setInsurances] = useState<Insurance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<"all" | "insured" | "uninsured">("all")
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    fetchPatients()
  }, [filter, search, page])

  useEffect(() => {
    fetchInsurances()
  }, [])

  async function fetchPatients() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `/api/patients/list?filter=${filter}&search=${encodeURIComponent(search)}&page=${page}&limit=${pagination.limit}`
      )
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error || "Impossible de charger les patients")
        return
      }
      setPatientsData(data.data || [])
      if (data.pagination) {
        setPagination(data.pagination)
      }
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
      if (!res.ok) {
        return
      }
      setInsurances(data.data || [])
    } catch (err) {
      // Keep silent, insurance list is optional for viewing
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Patients" description="Gérer les dossiers des patients">
        <div className="flex items-center gap-2 w-full">
          <Input
            placeholder="Rechercher par nom ou téléphone..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setPage(1)
            }}
            className="max-w-xs"
          />
          <Select
            value={filter}
            onValueChange={(v) => {
              setFilter(v as typeof filter)
              setPage(1)
            }}
          >
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="insured">Assurés</SelectItem>
              <SelectItem value="uninsured">Non assurés</SelectItem>
            </SelectContent>
          </Select>

          <Button asChild size="sm">
            <Link href="/patients/new">
              <Plus className="size-4 mr-1" />
              Nouveau patient
            </Link>
          </Button>
        </div>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement des patients...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : patientsData.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Aucun patient trouvé</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Sexe</TableHead>
                  <TableHead>Date de naissance</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Assurance</TableHead>
                  <TableHead>Expiration</TableHead>
                  <TableHead>Inscription</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patientsData.map((patient) => {
                  const ins = insurances.find((i) => i.id === patient.insuranceId)
                  return (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div className="font-medium text-foreground">
                          {patient.firstName} {patient.lastName}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatGender(patient.gender)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="size-3.5" />
                          {new Date(patient.dateOfBirth).toLocaleDateString("fr-FR")}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Phone className="size-3.5" />
                          {patient.phone}
                        </div>
                      </TableCell>
                      <TableCell>
                        {patient.isInsured ? (
                          <Badge
                            variant="outline"
                            className="border-primary/30 bg-primary/5 text-primary text-xs"
                          >
                            <Shield className="size-3 mr-1" />
                            {ins?.name ?? "Assuré"}
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-muted-foreground/30 text-muted-foreground text-xs"
                          >
                            <ShieldOff className="size-3 mr-1" />
                            Non assuré
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {patient.insuranceExpiryDate
                          ? new Date(patient.insuranceExpiryDate).toLocaleDateString("fr-FR")
                          : "-"}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-xs">
                        {new Date(patient.createdAt).toLocaleDateString("fr-FR")}
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" asChild>
                          <Link href={`/patients/${patient.id}/edit`}>Modifier</Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!loading && patientsData.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Affichage {(pagination.page - 1) * pagination.limit + 1} à{" "}
            {Math.min(pagination.page * pagination.limit, pagination.total)} sur{" "}
            {pagination.total} patients
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Précédent
            </Button>
            <Button variant="outline" size="sm" disabled>
              {pagination.page} / {pagination.totalPages || 1}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page === pagination.totalPages || pagination.totalPages === 0}
              onClick={() => setPage(page + 1)}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
