"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Plus, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"

interface Insurance {
  id: string
  name: string
  isActive: boolean
}

interface Province {
  id: string
  name: string
}

interface Commune {
  id: string
  name: string
  provinceId: string
}

interface Zone {
  id: string
  name: string
  communeId: string
}

interface Quartier {
  id: string
  name: string
  zoneId: string
}

interface PatientResponse {
  id: string
  firstName: string
  lastName: string
  dateOfBirth: string
  gender: string
  phone: string
  quartierId: string | null
  isInsured: boolean
  insurances: Array<{
    insuranceId: string
    insuranceNumber: string | null
    insuranceCardNumber: string | null
    insuranceExpiryDate: string | null
    coverageRate: string
  }>
  quartier?: {
    id: string
    zone?: {
      id: string
      commune?: {
        id: string
        province?: {
          id: string
        }
      }
    }
  }
}

export default function EditPatientPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const patientId = params.id
  const [loading, setLoading] = useState(false)
  const [pageLoading, setPageLoading] = useState(true)
  const [insurancesList, setInsurancesList] = useState<Insurance[]>([])
  const [provinces, setProvinces] = useState<Province[]>([])
  const [communes, setCommunes] = useState<Commune[]>([])
  const [zones, setZones] = useState<Zone[]>([])
  const [quartiers, setQuartiers] = useState<Quartier[]>([])

  const [selectedProvinceId, setSelectedProvinceId] = useState<string>("")
  const [selectedCommuneId, setSelectedCommuneId] = useState<string>("")
  const [selectedZoneId, setSelectedZoneId] = useState<string>("")

  const [patientInsurances, setPatientInsurances] = useState<any[]>([])

  const [newPatient, setNewPatient] = useState({
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "Male",
    phone: "",
    address: "",
    quartierId: null as string | null,
    isInsured: false,
  })

  useEffect(() => {
    fetchInsurances()
    fetchProvinces()
  }, [])

  useEffect(() => {
    if (patientId) {
      fetchPatient(patientId)
    }
  }, [patientId])

  useEffect(() => {
    if (!selectedProvinceId) {
      setCommunes([])
      return
    }
    fetchCommunes(selectedProvinceId)
  }, [selectedProvinceId])

  useEffect(() => {
    if (!selectedCommuneId) {
      setZones([])
      return
    }
    fetchZones(selectedCommuneId)
  }, [selectedCommuneId])

  useEffect(() => {
    if (!selectedZoneId) {
      setQuartiers([])
      return
    }
    fetchQuartiers(selectedZoneId)
  }, [selectedZoneId])

  async function fetchInsurances() {
    try {
      const res = await fetch("/api/insurances/list?active=true")
      const data = await res.json()
      if (res.ok) setInsurancesList(data.data || [])
    } catch (err) {
      console.error(err)
    }
  }

  async function fetchProvinces() {
    try {
      const res = await fetch("/api/locations/provinces")
      const data = await res.json()
      if (res.ok) setProvinces(data || [])
    } catch (err) {
      toast.error("Impossible de charger les provinces")
    }
  }

  async function fetchCommunes(provinceId: string) {
    try {
      const res = await fetch(`/api/locations/communes?provinceId=${provinceId}`)
      const data = await res.json()
      if (res.ok) setCommunes(data || [])
    } catch (err) {
      toast.error("Impossible de charger les communes")
    }
  }

  async function fetchZones(communeId: string) {
    try {
      const res = await fetch(`/api/locations/zones?communeId=${communeId}`)
      const data = await res.json()
      if (res.ok) setZones(data || [])
    } catch (err) {
      toast.error("Impossible de charger les zones")
    }
  }

  async function fetchQuartiers(zoneId: string) {
    try {
      const res = await fetch(`/api/locations/quartiers?zoneId=${zoneId}`)
      const data = await res.json()
      if (res.ok) setQuartiers(data || [])
    } catch (err) {
      toast.error("Impossible de charger les quartiers")
    }
  }

  async function fetchPatient(id: string) {
    setPageLoading(true)
    try {
      const res = await fetch(`/api/patients/${id}`)
      const data: PatientResponse = await res.json()
      if (!res.ok) {
        toast.error("Impossible de charger le patient")
        return
      }

      const provinceId = data.quartier?.zone?.commune?.province?.id ?? ""
      const communeId = data.quartier?.zone?.commune?.id ?? ""
      const zoneId = data.quartier?.zone?.id ?? ""

      setSelectedProvinceId(provinceId)
      setSelectedCommuneId(communeId)
      setSelectedZoneId(zoneId)

      setNewPatient({
        firstName: data.firstName ?? "",
        lastName: data.lastName ?? "",
        dateOfBirth: data.dateOfBirth ?? "",
        gender: data.gender ?? "Male",
        phone: data.phone ?? "",
        address: (data as any).address ?? "",
        quartierId: data.quartierId ?? null,
        isInsured: data.isInsured ?? false,
      })

      setPatientInsurances(data.insurances.map(ins => ({
        insuranceId: ins.insuranceId,
        insuranceNumber: ins.insuranceNumber ?? "",
        insuranceCardNumber: ins.insuranceCardNumber ?? "",
        insuranceExpiryDate: ins.insuranceExpiryDate ?? "",
        coverageRate: ins.coverageRate ?? "0"
      })))

      if (data.insurances.length === 0) {
        setPatientInsurances([{ insuranceId: "", insuranceNumber: "", insuranceExpiryDate: "", coverageRate: "0", insuranceCardNumber: "" }])
      }

    } catch (err) {
      toast.error("Impossible de charger le patient")
    } finally {
      setPageLoading(false)
    }
  }

  const addInsurance = () => {
    setPatientInsurances([
      ...patientInsurances,
      { insuranceId: "", insuranceNumber: "", insuranceExpiryDate: "", coverageRate: "0", insuranceCardNumber: "" }
    ])
  }

  const removeInsurance = (index: number) => {
    setPatientInsurances(patientInsurances.filter((_, i) => i !== index))
  }

  const updateInsurance = (index: number, field: string, value: any) => {
    const updated = [...patientInsurances]
    updated[index] = { ...updated[index], [field]: value }
    setPatientInsurances(updated)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!newPatient.firstName || !newPatient.lastName) {
      toast.error("Veuillez renseigner le nom et le prénom")
      return
    }
    if (!newPatient.quartierId) {
      toast.error("Veuillez sélectionner le quartier")
      return
    }

    setLoading(true)
    try {
      const payload = {
        ...newPatient,
        insurances: newPatient.isInsured ? patientInsurances : []
      }
      const res = await fetch(`/api/patients/${patientId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error || "Échec de mise à jour du patient")
        return
      }
      toast.success("Patient mis à jour avec succès")
      router.push("/patients")
    } catch (err) {
      toast.error("Échec de mise à jour du patient")
    } finally {
      setLoading(false)
    }
  }

  if (pageLoading) {
    return <div className="p-6">Chargement...</div>
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Modifier le patient" description="Mettre à jour le dossier patient">
        <Button variant="outline" asChild>
          <Link href="/patients">
            <ArrowLeft className="size-4 mr-2" />
            Retour aux patients
          </Link>
        </Button>
      </PageHeader>

      <Card>
        <CardContent className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="first_name">Prénom</Label>
                <Input
                  id="first_name"
                  value={newPatient.firstName}
                  onChange={(e) => setNewPatient((p) => ({ ...p, firstName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="last_name">Nom</Label>
                <Input
                  id="last_name"
                  value={newPatient.lastName}
                  onChange={(e) => setNewPatient((p) => ({ ...p, lastName: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="dob">Date de naissance</Label>
                <Input
                  id="dob"
                  type="date"
                  value={newPatient.dateOfBirth}
                  onChange={(e) => setNewPatient((p) => ({ ...p, dateOfBirth: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gender">Sexe</Label>
                <Select
                  value={newPatient.gender}
                  onValueChange={(v) => setNewPatient((p) => ({ ...p, gender: v }))}
                >
                  <SelectTrigger id="gender">
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Homme</SelectItem>
                    <SelectItem value="Female">Femme</SelectItem>
                    <SelectItem value="Other">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input
                  id="phone"
                  value={newPatient.phone}
                  onChange={(e) => setNewPatient((p) => ({ ...p, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Adresse (Avenue, Rue, Parents...)</Label>
                <Input
                  id="address"
                  value={newPatient.address}
                  placeholder="ex: Avenue du Large, Maison n°12..."
                  onChange={(e) => setNewPatient((p) => ({ ...p, address: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label>Province</Label>
                <Select
                  value={selectedProvinceId}
                  onValueChange={(value) => {
                    setSelectedProvinceId(value)
                    setSelectedCommuneId("")
                    setSelectedZoneId("")
                    setNewPatient((p) => ({ ...p, quartierId: null }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Commune</Label>
                <Select
                  value={selectedCommuneId}
                  onValueChange={(value) => {
                    setSelectedCommuneId(value)
                    setSelectedZoneId("")
                    setNewPatient((p) => ({ ...p, quartierId: null }))
                  }}
                  disabled={!selectedProvinceId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    {communes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Zone</Label>
                <Select
                  value={selectedZoneId}
                  onValueChange={(value) => {
                    setSelectedZoneId(value)
                    setNewPatient((p) => ({ ...p, quartierId: null }))
                  }}
                  disabled={!selectedCommuneId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    {zones.map((z) => (
                      <SelectItem key={z.id} value={z.id}>{z.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Quartier</Label>
                <Select
                  value={newPatient.quartierId ?? ""}
                  onValueChange={(value) => setNewPatient((p) => ({ ...p, quartierId: value }))}
                  disabled={!selectedZoneId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir" />
                  </SelectTrigger>
                  <SelectContent>
                    {quartiers.map((q) => (
                      <SelectItem key={q.id} value={q.id}>{q.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-4 border-t">
              <Switch
                checked={newPatient.isInsured}
                onCheckedChange={(c) => setNewPatient((p) => ({ ...p, isInsured: c }))}
              />
              <Label className="font-semibold text-lg">Assurances du patient</Label>
            </div>

            {newPatient.isInsured && (
              <div className="space-y-4">
                {patientInsurances.map((ins, index) => (
                  <Card key={index} className="border-dashed bg-muted/30">
                    <CardContent className="p-4 space-y-4">
                      <div className="flex justify-between items-center">
                        <Badge variant="outline">Assurance #{index + 1}</Badge>
                        {patientInsurances.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeInsurance(index)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-2">
                          <Label>Compagnie d'assurance</Label>
                          <Select
                            value={ins.insuranceId}
                            onValueChange={(v) => updateInsurance(index, 'insuranceId', v)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Choisir" />
                            </SelectTrigger>
                            <SelectContent>
                              {insurancesList.map((i) => (
                                <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Numéro de police</Label>
                          <Input
                            value={ins.insuranceNumber}
                            onChange={(e) => updateInsurance(index, 'insuranceNumber', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Numéro de carte</Label>
                          <Input
                            value={ins.insuranceCardNumber}
                            onChange={(e) => updateInsurance(index, 'insuranceCardNumber', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Taux de couverture (%)</Label>
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            value={ins.coverageRate}
                            onChange={(e) => updateInsurance(index, 'coverageRate', e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Date d'expiration</Label>
                          <Input
                            type="date"
                            value={ins.insuranceExpiryDate}
                            onChange={(e) => updateInsurance(index, 'insuranceExpiryDate', e.target.value)}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full border-dashed"
                  onClick={addInsurance}
                >
                  <Plus className="size-4 mr-2" />
                  Ajouter une autre assurance
                </Button>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => router.push("/patients")}>
                Annuler
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
