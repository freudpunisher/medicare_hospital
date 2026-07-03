"use client"

import { useEffect, useState } from "react"
import { Plus, Trash2, Power, PowerOff, Loader2, Users, Building2, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { PageHeader } from "@/components/page-header"
import { StatusBadge } from "@/components/status-badge"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface Employee {
  id: string
  partnerId: string
  patientId: string
  employeeNumber: string
  department: string | null
  position: string | null
  hireDate: string | null
  isActive: boolean
  partnerName: string | null
  patientName: string | null
}

interface Partner {
  id: string
  companyName: string
}

interface Patient {
  id: string
  firstName: string
  lastName: string
}

export default function EmployeesPage() {
  const [data, setData] = useState<Employee[]>([])
  const [loading, setLoading] = useState(true)
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [partners, setPartners] = useState<Partner[]>([])
  const [patients, setPatients] = useState<Patient[]>([])
  const [form, setForm] = useState({
    partnerId: "",
    patientId: "",
    employeeNumber: "",
    department: "",
    position: "",
    hireDate: "",
  })

  useEffect(() => {
    fetchEmployees()
    fetchPartners()
    fetchPatients()
  }, [])

  async function fetchEmployees() {
    setLoading(true)
    try {
      const res = await fetch("/api/partners/employees/list")
      const result = await res.json()
      if (res.ok && result.success) {
        setData(result.data)
      } else {
        toast.error(result.error || "Erreur lors du chargement des employés")
      }
    } catch (err) {
      toast.error("Impossible de se connecter au serveur")
    } finally {
      setLoading(false)
    }
  }

  async function fetchPartners() {
    try {
      const res = await fetch("/api/partners/list")
      const result = await res.json()
      if (res.ok && result.success) {
        setPartners(result.data)
      }
    } catch (err) {
      // silent
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

  async function handleAdd() {
    if (!form.partnerId || !form.patientId || !form.employeeNumber) return
    setSubmitting(true)
    try {
      const res = await fetch("/api/partners/employees/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          hireDate: form.hireDate || null,
        }),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success("Employé ajouté avec succès")
        setOpen(false)
        setForm({ partnerId: "", patientId: "", employeeNumber: "", department: "", position: "", hireDate: "" })
        fetchEmployees()
      } else {
        toast.error(result.error || "Erreur lors de l'ajout")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    } finally {
      setSubmitting(false)
    }
  }

  async function toggleStatus(emp: Employee) {
    try {
      const res = await fetch(`/api/partners/employees/${emp.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !emp.isActive }),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success(`Employé ${!emp.isActive ? 'activé' : 'désactivé'}`)
        setData(prev => prev.map(e => e.id === emp.id ? { ...e, isActive: !e.isActive } : e))
      } else {
        toast.error(result.error || "Erreur lors de la modification")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    }
  }

  async function handleDelete(id: string) {
    try {
      const res = await fetch(`/api/partners/employees/${id}`, { method: "DELETE" })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success("Employé supprimé")
        setData(prev => prev.filter(e => e.id !== id))
      } else {
        toast.error(result.error || "Erreur lors de la suppression")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    }
  }

  function getPatientDisplay(patientId: string) {
    const patient = patients.find(p => p.id === patientId)
    if (patient) return `${patient.firstName} ${patient.lastName}`
    return patientId
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Employés Partenaires" description="Gérer les employés des entreprises partenaires">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="rounded-full shadow-md px-5 font-bold">
              <Plus className="size-4 mr-2" />
              Nouvel Employé
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-[2.5rem] border-none shadow-2xl backdrop-blur-xl bg-card/95">
            <DialogHeader>
              <DialogTitle className="text-2xl font-black">Ajouter un Employé</DialogTitle>
              <DialogDescription>Enregistrez un employé d'une entreprise partenaire.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-6 py-6">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Entreprise partenaire</Label>
                <Select
                  value={form.partnerId}
                  onValueChange={(v) => setForm((f) => ({ ...f, partnerId: v }))}
                >
                  <SelectTrigger className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20">
                    <SelectValue placeholder="Sélectionnez une entreprise" />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-none shadow-xl">
                    {partners.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.companyName}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Patient</Label>
                <Select
                  value={form.patientId}
                  onValueChange={(v) => setForm((f) => ({ ...f, patientId: v }))}
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
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Numéro d'employé</Label>
                <Input
                  placeholder="ex: EMP-001"
                  className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                  value={form.employeeNumber}
                  onChange={(e) => setForm((f) => ({ ...f, employeeNumber: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Département</Label>
                  <Input
                    placeholder="ex: Ressources Humaines"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.department}
                    onChange={(e) => setForm((f) => ({ ...f, department: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Poste</Label>
                  <Input
                    placeholder="ex: Infirmier"
                    className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                    value={form.position}
                    onChange={(e) => setForm((f) => ({ ...f, position: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Date d'embauche</Label>
                <Input
                  type="date"
                  className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                  value={form.hireDate}
                  onChange={(e) => setForm((f) => ({ ...f, hireDate: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter className="gap-2">
              <Button variant="ghost" onClick={() => setOpen(false)} className="rounded-full font-bold">Annuler</Button>
              <Button onClick={handleAdd} disabled={submitting || !form.partnerId || !form.patientId || !form.employeeNumber} className="rounded-full font-black px-8 shadow-lg">
                {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Plus className="size-4 mr-2" />}
                Créer l'Employé
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="size-10 animate-spin text-primary opacity-50" />
              <p className="text-muted-foreground font-bold text-sm animate-pulse">Chargement des employés...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-6">
              <div className="size-20 rounded-[2rem] bg-muted/30 flex items-center justify-center text-muted-foreground/40 border-2 border-dashed border-muted-foreground/20">
                <Users className="size-10" />
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-black tracking-tight">Aucun employé</h3>
                <p className="text-sm text-muted-foreground mt-1">Aucun employé partenaire n'est encore enregistré.</p>
              </div>
              <Button variant="outline" className="rounded-full font-black text-xs uppercase" onClick={() => setOpen(true)}>
                Ajouter mon premier employé
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest py-5">N° Employé</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Partenaire</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Patient</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Département</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Poste</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Statut</TableHead>
                  <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-widest py-5">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((emp) => (
                  <TableRow key={emp.id} className="group hover:bg-muted/40 transition-colors border-muted/50">
                    <TableCell className="pl-8 py-5">
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/10 group-hover:bg-primary transition-colors group-hover:text-primary-foreground shadow-sm">
                          <Users className="size-5" />
                        </div>
                        <p className="font-black text-base tracking-tight">{emp.employeeNumber}</p>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <div className="flex items-center gap-2">
                        <Building2 className="size-4 text-muted-foreground/50" />
                        <span className="text-xs font-medium">{emp.partnerName || <span className="opacity-30 italic">—</span>}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-5">
                      <p className="text-xs font-medium">
                        {emp.patientName || <span className="opacity-30 italic">—</span>}
                      </p>
                    </TableCell>
                    <TableCell className="py-5">
                      <p className="text-xs text-muted-foreground">
                        {emp.department || <span className="opacity-30 italic">—</span>}
                      </p>
                    </TableCell>
                    <TableCell className="py-5">
                      <p className="text-xs text-muted-foreground">
                        {emp.position || <span className="opacity-30 italic">—</span>}
                      </p>
                    </TableCell>
                    <TableCell className="py-5">
                      <StatusBadge active={emp.isActive} />
                    </TableCell>
                    <TableCell className="text-right pr-8 py-5">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className={cn(
                            "rounded-full size-9 transition-all",
                            emp.isActive ? "hover:bg-red-500/10 hover:text-red-600" : "hover:bg-green-500/10 hover:text-green-600"
                          )}
                          onClick={() => toggleStatus(emp)}
                          title={emp.isActive ? "Désactiver" : "Activer"}
                        >
                          {emp.isActive ? <PowerOff className="size-4" /> : <Power className="size-4" />}
                        </Button>

                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full size-9 opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-[2rem] border-none shadow-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle className="text-xl font-black">Supprimer l'employé {emp.employeeNumber} ?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Cette action est irréversible. L'employé sera définitivement retiré du système.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-full font-bold">Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(emp.id)}
                                className="rounded-full font-black bg-destructive hover:bg-destructive/90"
                              >
                                Confirmer la Suppression
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!loading && data.length > 0 && (
        <p className="text-[10px] font-bold text-center text-muted-foreground uppercase tracking-[0.2em] pt-4">
          — Total de {data.length} employés partenaires enregistrés —
        </p>
      )}
    </div>
  )
}
