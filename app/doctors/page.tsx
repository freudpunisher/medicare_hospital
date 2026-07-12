"use client"

import { useEffect, useState } from "react"
import { Plus, Phone, Stethoscope, Search, Loader2, Users, UserCheck, Building2, Mail, BadgeCheck, Pencil, ToggleLeft, ToggleRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { StatusBadge } from "@/components/status-badge"
import { toast } from "sonner"

interface Doctor {
  id: string
  fullName: string | null
  phone: string
  email: string | null
  licenseNumber: string | null
  isActive: boolean
  specialty: { id: string; name: string } | null
}

interface Specialty {
  id: string
  name: string
  isActive: boolean
}

interface UnassignedUser {
  id: string
  fullName: string | null
  username: string
}

export default function DoctorsPage() {
  const [data, setData] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [specialties, setSpecialties] = useState<Specialty[]>([])
  const [unassignedUsers, setUnassignedUsers] = useState<UnassignedUser[]>([])
  const [form, setForm] = useState({
    userId: "",
    specialtyId: "",
    phone: "",
    email: "",
    licenseNumber: "",
  })

  useEffect(() => { fetchDoctors() }, [])
  useEffect(() => {
    fetch("/api/specialties/list").then(r => r.json()).then(r => {
      if (r.success) setSpecialties(r.data)
    })
  }, [])
  useEffect(() => {
    if (open) {
      fetch("/api/doctors/list").then(r => r.json()).then(r => {
        if (r.success) setUnassignedUsers(r.data)
      })
    }
  }, [open])

  async function fetchDoctors() {
    setLoading(true)
    try {
      const res = await fetch("/api/doctors/list?active=all&unassigned=false")
      const result = await res.json()
      if (result.success) setData(result.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  async function handleCreate() {
    if (!form.userId || !form.specialtyId || !form.phone) {
      toast.error("Veuillez remplir tous les champs obligatoires")
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/doctors/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const result = await res.json()
      if (!res.ok) {
        toast.error(result.error || "Erreur lors de la création")
        return
      }
      toast.success("Médecin créé avec succès")
      setOpen(false)
      setForm({ userId: "", specialtyId: "", phone: "", email: "", licenseNumber: "" })
      fetchDoctors()
    } catch (err) {
      toast.error("Erreur lors de la création")
    } finally {
      setSaving(false)
    }
  }

  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null)
  const [editForm, setEditForm] = useState({
    specialtyId: "",
    phone: "",
    email: "",
    licenseNumber: "",
  })

  function openEdit(doc: Doctor) {
    setEditingDoctor(doc)
    setEditForm({
      specialtyId: doc.specialty?.id || "",
      phone: doc.phone,
      email: doc.email || "",
      licenseNumber: doc.licenseNumber || "",
    })
  }

  async function handleSaveEdit() {
    if (!editingDoctor) return
    setSaving(true)
    try {
      const res = await fetch(`/api/users/${editingDoctor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      })
      if (!res.ok) { toast.error("Erreur lors de la modification"); return }
      toast.success("Médecin modifié")
      setEditingDoctor(null)
      fetchDoctors()
    } catch { toast.error("Erreur lors de la modification") }
    finally { setSaving(false) }
  }

  async function handleToggleActive(doc: Doctor) {
    try {
      const res = await fetch(`/api/users/${doc.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !doc.isActive }),
      })
      if (!res.ok) { toast.error("Erreur"); return }
      toast.success(doc.isActive ? "Médecin désactivé" : "Médecin activé")
      fetchDoctors()
    } catch { toast.error("Erreur") }
  }

  const filtered = data.filter((d) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      d.fullName?.toLowerCase().includes(q) ||
      d.specialty?.name?.toLowerCase().includes(q) ||
      d.phone.includes(q)
    )
  })

  const activeCount = data.filter((d) => d.isActive).length

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Médecins" description="Gérer le personnel médical">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4 mr-1" />
              Nouveau Médecin
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Nouveau Médecin</DialogTitle>
              <DialogDescription>Assigner une spécialité à un utilisateur docteur.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Utilisateur</Label>
                <Select
                  value={form.userId}
                  onValueChange={(v) => {
                    const user = unassignedUsers.find(u => u.id === v)
                    setForm(prev => ({
                      ...prev,
                      userId: v,
                      email: user ? `${user.username}@clinic.com` : "",
                      licenseNumber: user ? `LIC-${user.username.split('.')[0].toUpperCase()}` : "",
                    }))
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un docteur" />
                  </SelectTrigger>
                  <SelectContent>
                    {unassignedUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.fullName || u.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Spécialité</Label>
                <Select
                  value={form.specialtyId}
                  onValueChange={(v) => setForm(prev => ({ ...prev, specialtyId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une spécialité" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.filter(s => s.isActive).map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    placeholder="+221 77 123 45 67"
                    value={form.phone}
                    onChange={(e) => setForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    placeholder="jean@clinic.com"
                    value={form.email}
                    onChange={(e) => setForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Numéro de licence</Label>
                <Input
                  placeholder="LIC-JEAN"
                  value={form.licenseNumber}
                  onChange={(e) => setForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                Créer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        {/* Edit Dialog */}
        <Dialog open={!!editingDoctor} onOpenChange={(v) => { if (!v) setEditingDoctor(null) }}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Modifier {editingDoctor?.fullName || "le médecin"}</DialogTitle>
              <DialogDescription>Mettre à jour les informations du médecin.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Spécialité</Label>
                <Select
                  value={editForm.specialtyId}
                  onValueChange={(v) => setEditForm(prev => ({ ...prev, specialtyId: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner une spécialité" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.filter(s => s.isActive).map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Téléphone</Label>
                  <Input
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Numéro de licence</Label>
                <Input
                  value={editForm.licenseNumber}
                  onChange={(e) => setEditForm(prev => ({ ...prev, licenseNumber: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingDoctor(null)}>Annuler</Button>
              <Button onClick={handleSaveEdit} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                Enregistrer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0"><Users className="size-5" /></div>
            <div><p className="text-2xl font-black leading-none">{data.length}</p><p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Total</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600 shrink-0"><UserCheck className="size-5" /></div>
            <div><p className="text-2xl font-black text-green-600 leading-none">{activeCount}</p><p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Actifs</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-amber-500/5 to-amber-500/10">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0"><Building2 className="size-5" /></div>
            <div><p className="text-2xl font-black text-amber-600 leading-none">{new Set(data.filter(d => d.specialty).map(d => d.specialty!.name)).size}</p><p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-1">Spécialités</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher un médecin..."
          className="pl-11 h-11 rounded-2xl border-muted/50 bg-card/50 focus:ring-primary/20"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="size-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <p className="text-muted-foreground font-bold text-sm animate-pulse">Chargement des médecins...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-20 text-center">
              <p className="text-muted-foreground font-bold">Aucun médecin trouvé</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest py-5">Médecin</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Spécialité</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Email</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Téléphone</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Licence</TableHead>
                      <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Statut</TableHead>
                      <TableHead className="pr-8 font-black text-[10px] uppercase tracking-widest py-5 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((doc) => (
                      <TableRow key={doc.id} className="group hover:bg-muted/40 transition-colors border-muted/50">
                        <TableCell className="pl-8 py-4">
                          <div className="flex items-center gap-3">
                            <div className="size-10 rounded-full bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                              <Stethoscope className="size-5" />
                            </div>
                            <p className="font-bold">Dr. {doc.fullName || "N/A"}</p>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <Badge variant="outline" className="rounded-full text-[10px] font-bold px-3 py-1 border-primary/20 bg-primary/5 text-primary">
                            {doc.specialty?.name || "Généraliste"}
                          </Badge>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Mail className="size-3.5" />
                            <span className="text-sm">{doc.email || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Phone className="size-3.5" />
                            <span className="text-sm">{doc.phone}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1.5 text-muted-foreground">
                            <BadgeCheck className="size-3.5" />
                            <span className="text-sm">{doc.licenseNumber || "—"}</span>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <StatusBadge active={doc.isActive} />
                        </TableCell>
                        <TableCell className="pr-8 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="size-8" onClick={() => openEdit(doc)}>
                              <Pencil className="size-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="size-8 text-muted-foreground hover:text-amber-600" onClick={() => handleToggleActive(doc)}>
                              {doc.isActive ? <ToggleLeft className="size-4" /> : <ToggleRight className="size-4 text-green-600" />}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="px-8 py-4 border-t border-muted/30 flex items-center justify-between bg-muted/10">
                <p className="text-[11px] font-bold text-muted-foreground">
                  {filtered.length} médecin{filtered.length > 1 ? "s" : ""}
                  {filtered.length < data.length && ` (sur ${data.length})`}
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
