"use client"

import { useEffect, useState } from "react"
import { Plus, ShieldAlert, PowerOff, Power } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { toast } from "sonner"

interface Act {
  id: string
  code: string
  name: string
  serviceId: string
  specialtyId: string | null
  basePrice: string
  requiresAuthorization: boolean
  isActive: boolean
}

interface Service {
  id: string
  name: string
  isActive: boolean
}

interface Specialty {
  id: string
  name: string
  isActive: boolean
}

export default function ActsPage() {
  const [data, setData] = useState<Act[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    code: "",
    name: "",
    serviceId: "",
    specialtyId: null as string | null,
    basePrice: 0,
    requiresAuthorization: false,
    isActive: true,
  })

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    setError(null)
    try {
      const [actsRes, servicesRes, specialtiesRes] = await Promise.all([
        fetch("/api/acts/list"),
        fetch("/api/services/list?active=true"),
        fetch("/api/specialties/list?active=true"),
      ])

      const actsData = await actsRes.json()
      const servicesData = await servicesRes.json()
      const specialtiesData = await specialtiesRes.json()

      if (!actsRes.ok) {
        setError(actsData?.error || "Impossible de charger les actes médicaux")
        return
      }

      setData(actsData.data || [])
      if (servicesRes.ok) setServices(servicesData.data || [])
      if (specialtiesRes.ok) setSpecialties(specialtiesData.data || [])
    } catch (err) {
      setError("Impossible de charger les actes médicaux")
    } finally {
      setLoading(false)
    }
  }

  async function handleAdd() {
    if (!form.code || !form.name || !form.serviceId) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }
    try {
      const res = await fetch("/api/acts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code,
          name: form.name,
          serviceId: form.serviceId,
          specialtyId: form.specialtyId,
          basePrice: form.basePrice,
          requiresAuthorization: form.requiresAuthorization,
          isActive: form.isActive,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data?.error || "Échec de l'ajout de l'acte médical")
        return
      }
      setOpen(false)
      setForm({
        code: "",
        name: "",
        serviceId: "",
        specialtyId: null,
        basePrice: 0,
        requiresAuthorization: false,
        isActive: true,
      })
      await fetchAll()
      toast.success("Acte médical ajouté avec succès")
    } catch (err) {
      toast.error("Échec de l'ajout de l'acte médical")
    }
  }

  async function handleToggleActive(act: Act) {
    setTogglingId(act.id)
    try {
      const res = await fetch(`/api/acts/${act.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !act.isActive }),
      })
      const resData = await res.json()
      if (!res.ok) {
        toast.error(resData?.error || "Échec de la mise à jour du statut")
        return
      }
      setData((prev) =>
        prev.map((a) => (a.id === act.id ? { ...a, isActive: !act.isActive } : a))
      )
      toast.success(act.isActive ? "Acte désactivé" : "Acte activé")
    } catch (err) {
      toast.error("Échec de la mise à jour du statut")
    } finally {
      setTogglingId(null)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Actes Médicaux" description="Gérer les actes et procédures médicaux facturables">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="size-4 mr-1" />Ajouter un acte</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouvel acte médical</DialogTitle>
              <DialogDescription>Renseignez les détails de l'acte ci-dessous.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input
                    value={form.code}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))
                    }
                    placeholder="ex. CONS-GEN"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="ex. Consultation générale"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Service</Label>
                  <Select
                    value={form.serviceId}
                    onValueChange={(v) => setForm((f) => ({ ...f, serviceId: v }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choisir un service" />
                    </SelectTrigger>
                    <SelectContent>
                      {services.filter((s) => s.isActive).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Spécialité (optionnel)</Label>
                  <Select
                    value={form.specialtyId ?? "none"}
                    onValueChange={(v) =>
                      setForm((f) => ({ ...f, specialtyId: v === "none" ? null : v }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Aucune" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Aucune</SelectItem>
                      {specialties.filter((s) => s.isActive).map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Prix de base (FBU)</Label>
                <Input
                  type="number"
                  min={0}
                  step={1}
                  value={form.basePrice}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, basePrice: parseFloat(e.target.value) || 0 }))
                  }
                />
              </div>
              <div className="flex items-center gap-3">
                <Switch
                  checked={form.requiresAuthorization}
                  onCheckedChange={(c) =>
                    setForm((f) => ({ ...f, requiresAuthorization: c }))
                  }
                />
                <Label>Nécessite une autorisation</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={handleAdd}>Ajouter</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Chargement des actes médicaux...</div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">{error}</div>
          ) : data.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Aucun acte médical trouvé</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Code</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Spécialité</TableHead>
                  <TableHead>Prix (FBU)</TableHead>
                  <TableHead>Autorisation</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((act) => {
                  const service = services.find((s) => s.id === act.serviceId)
                  const specialty = specialties.find((s) => s.id === act.specialtyId)
                  const price = Number(act.basePrice)
                  return (
                    <TableRow key={act.id}>
                      <TableCell>
                        <Badge variant="secondary" className="font-mono text-xs">
                          {act.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium text-foreground">{act.name}</TableCell>
                      <TableCell className="text-muted-foreground">{service?.name ?? "N/A"}</TableCell>
                      <TableCell className="text-muted-foreground">{specialty?.name ?? "-"}</TableCell>
                      <TableCell className="font-medium text-foreground">
                        {Number.isNaN(price)
                          ? act.basePrice
                          : price.toLocaleString("fr-FR")}{" "}
                        <span className="text-xs text-muted-foreground">FBU</span>
                      </TableCell>
                      <TableCell>
                        {act.requiresAuthorization ? (
                          <Badge
                            variant="outline"
                            className="border-warning/30 bg-warning/10 text-warning text-xs"
                          >
                            <ShieldAlert className="size-3 mr-1" />
                            Requise
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">Non</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <StatusBadge active={act.isActive} />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={togglingId === act.id}
                          onClick={() => handleToggleActive(act)}
                          className={
                            act.isActive
                              ? "text-destructive border-destructive/30 hover:bg-destructive/10"
                              : "text-green-600 border-green-600/30 hover:bg-green-50"
                          }
                        >
                          {act.isActive ? (
                            <><PowerOff className="size-3 mr-1" />Désactiver</>
                          ) : (
                            <><Power className="size-3 mr-1" />Activer</>
                          )}
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
    </div>
  )
}
