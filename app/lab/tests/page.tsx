"use client"

import { useState, useEffect } from "react"
import {
  Plus, Search, Loader2, FlaskConical, Pencil, Trash2, Beaker, Microscope,
  Activity, Droplets, Users, AlertCircle, X
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { PageHeader } from "@/components/page-header"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

const TEST_TYPES = [
  { value: "hematology", label: "Hématologie" },
  { value: "chemistry", label: "Biochimie" },
  { value: "microbiology", label: "Microbiologie" },
  { value: "immunology", label: "Immunologie" },
  { value: "serology", label: "Sérologie" },
  { value: "urinalysis", label: "Analyse d'Urine" },
  { value: "parasitology", label: "Parasitologie" },
  { value: "histopathology", label: "Histopathologie" },
  { value: "molecular", label: "Biologie Moléculaire" },
  { value: "endocrinology", label: "Endocrinologie" },
  { value: "other", label: "Autre" },
]

interface LabTest {
  id: string
  code: string
  name: string
  testType: string
  price: string
  turnaroundTimeHours: string
  isActive: boolean
  description: string | null
  instructions: string | null
  serviceId: string
  serviceName: string | null
  parameterCount: number
  createdAt: string
}

interface Parameter {
  id: string
  labTestId: string
  parameterCode: string
  parameterName: string
  unit: string
  referenceRangeLow: string | null
  referenceRangeHigh: string | null
  referenceRangeText: string | null
  maleRefRangeLow: string | null
  maleRefRangeHigh: string | null
  femaleRefRangeLow: string | null
  femaleRefRangeHigh: string | null
  sortOrder: string
  isActive: boolean
}

export default function LabTestsPage() {
  const [tests, setTests] = useState<LabTest[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [typeFilter, setTypeFilter] = useState("all")
  const [createOpen, setCreateOpen] = useState(false)
  const [detailTest, setDetailTest] = useState<any>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [editingParam, setEditingParam] = useState<Parameter | null>(null)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    code: "",
    name: "",
    description: "",
    testType: "hematology",
    price: "",
    turnaroundTimeHours: "24",
    instructions: "",
  })

  const [paramForm, setParamForm] = useState({
    parameterCode: "",
    parameterName: "",
    unit: "",
    referenceRangeLow: "",
    referenceRangeHigh: "",
    referenceRangeText: "",
    sortOrder: "0",
  })

  // Stats
  const totalTests = tests.length
  const activeTests = tests.filter(t => t.isActive).length
  const hematologyCount = tests.filter(t => t.testType === "hematology").length
  const chemistryCount = tests.filter(t => t.testType === "chemistry").length

  useEffect(() => { fetchTests() }, [search, typeFilter])

  async function fetchTests() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set("search", search)
      if (typeFilter !== "all") params.set("type", typeFilter)
      const res = await fetch(`/api/lab/tests?${params}`)
      const json = await res.json()
      if (res.ok) setTests(json.data)
    } catch { toast.error("Erreur de chargement") }
    finally { setLoading(false) }
  }

  async function handleCreate() {
    if (!form.code || !form.name || !form.price) return
    setSaving(true)
    try {
      const res = await fetch("/api/lab/tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (res.ok) {
        toast.success("Test créé")
        setCreateOpen(false)
        setForm({ code: "", name: "", description: "", testType: "hematology", price: "", turnaroundTimeHours: "24", instructions: "" })
        fetchTests()
      } else {
        const err = await res.json()
        toast.error(err.error || "Erreur")
      }
    } catch { toast.error("Erreur réseau") }
    finally { setSaving(false) }
  }

  async function handleViewDetails(testId: string) {
    setDetailLoading(true)
    setDetailOpen(true)
    try {
      const res = await fetch(`/api/lab/tests/${testId}`)
      const json = await res.json()
      if (res.ok) setDetailTest(json.data)
      else { toast.error("Erreur de chargement"); setDetailOpen(false) }
    } catch { toast.error("Erreur réseau"); setDetailOpen(false) }
    finally { setDetailLoading(false) }
  }

  async function handleDeleteTest(id: string) {
    if (!confirm("Supprimer ce test de laboratoire ?")) return
    try {
      const res = await fetch(`/api/lab/tests/${id}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Test supprimé")
        fetchTests()
      }
    } catch { toast.error("Erreur") }
  }

  async function handleAddParameter() {
    if (!paramForm.parameterCode || !paramForm.parameterName || !paramForm.unit) return
    if (!detailTest) return
    setSaving(true)
    try {
      const res = await fetch(`/api/lab/tests/${detailTest.id}/parameters`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paramForm),
      })
      if (res.ok) {
        toast.success("Paramètre ajouté")
        setParamForm({ parameterCode: "", parameterName: "", unit: "", referenceRangeLow: "", referenceRangeHigh: "", referenceRangeText: "", sortOrder: "0" })
        handleViewDetails(detailTest.id)
      } else {
        const err = await res.json()
        toast.error(err.error || "Erreur")
      }
    } catch { toast.error("Erreur réseau") }
    finally { setSaving(false) }
  }

  async function handleDeleteParam(paramId: string) {
    if (!confirm("Supprimer ce paramètre ?")) return
    try {
      const res = await fetch(`/api/lab/parameters/${paramId}`, { method: "DELETE" })
      if (res.ok) {
        toast.success("Paramètre supprimé")
        if (detailTest) handleViewDetails(detailTest.id)
      }
    } catch { toast.error("Erreur") }
  }

  const typeLabel = (type: string) => TEST_TYPES.find(t => t.value === type)?.label || type

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Catalogue des Tests de Laboratoire" description="Gérer la liste des examens biologiques et leurs paramètres">
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button className="rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
              <Plus className="size-4 mr-2" />Nouveau Test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden">
            <DialogHeader className="p-8 bg-primary text-primary-foreground">
              <DialogTitle className="text-xl font-black uppercase tracking-tight">Nouveau Test de Laboratoire</DialogTitle>
              <DialogDescription className="text-primary-foreground/70 font-bold text-[10px] uppercase tracking-widest mt-1">
                Ajouter un examen au catalogue
              </DialogDescription>
            </DialogHeader>
            <div className="p-8 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Code *</Label>
                  <Input placeholder="Ex: NFS" className="h-11 rounded-2xl font-bold uppercase" value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Type *</Label>
                  <Select value={form.testType} onValueChange={v => setForm(f => ({ ...f, testType: v }))}>
                    <SelectTrigger className="h-11 rounded-2xl font-bold"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-2xl">{TEST_TYPES.map(t => (
                      <SelectItem key={t.value} value={t.value} className="font-bold">{t.label}</SelectItem>
                    ))}</SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Nom *</Label>
                <Input placeholder="Ex: Numération Formule Sanguine" className="h-11 rounded-2xl font-bold" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Description</Label>
                <Textarea placeholder="Description du test..." className="rounded-2xl font-bold text-xs" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Prix (FBU) *</Label>
                  <Input type="number" placeholder="0" className="h-11 rounded-2xl font-bold" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Délai (heures)</Label>
                  <Input type="number" placeholder="24" className="h-11 rounded-2xl font-bold" value={form.turnaroundTimeHours} onChange={e => setForm(f => ({ ...f, turnaroundTimeHours: e.target.value }))} />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1">Instructions</Label>
                <Textarea placeholder="Instructions de prélèvement..." className="rounded-2xl font-bold text-xs" value={form.instructions} onChange={e => setForm(f => ({ ...f, instructions: e.target.value }))} />
              </div>
            </div>
            <DialogFooter className="p-6 bg-muted/30 border-t border-muted/50 gap-3">
              <Button variant="ghost" className="rounded-full font-black uppercase text-[10px] tracking-widest" onClick={() => setCreateOpen(false)}>Annuler</Button>
              <Button className="rounded-full font-black uppercase text-[10px] tracking-widest" onClick={handleCreate} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : "Créer le Test"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center"><FlaskConical className="size-5 text-primary" /></div>
            <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total Tests</p><p className="text-xl font-black">{totalTests}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"><Activity className="size-5 text-emerald-600" /></div>
            <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Actifs</p><p className="text-xl font-black">{activeTests}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-blue-500/20 flex items-center justify-center"><Droplets className="size-5 text-blue-600" /></div>
            <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Hématologie</p><p className="text-xl font-black">{hematologyCount}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-violet-500/10 to-violet-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-violet-500/20 flex items-center justify-center"><Beaker className="size-5 text-violet-600" /></div>
            <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Biochimie</p><p className="text-xl font-black">{chemistryCount}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input placeholder="Rechercher un test..." className="h-10 pl-10 rounded-full text-sm" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px] h-10 rounded-full font-bold text-xs"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent className="rounded-2xl">
            <SelectItem value="all" className="font-bold">Tous les types</SelectItem>
            {TEST_TYPES.map(t => (<SelectItem key={t.value} value={t.value} className="font-bold">{t.label}</SelectItem>))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="border-muted/50">
                <TableHead className="pl-8 font-black text-[9px] uppercase tracking-widest text-muted-foreground">Code</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Nom</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Type</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Prix</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Paramètres</TableHead>
                <TableHead className="font-black text-[9px] uppercase tracking-widest text-muted-foreground">Statut</TableHead>
                <TableHead className="pr-8 text-right font-black text-[9px] uppercase tracking-widest text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={7} className="h-48 text-center"><Loader2 className="size-8 animate-spin mx-auto text-primary opacity-20" /></TableCell></TableRow>
              ) : tests.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="h-48 text-center text-muted-foreground font-bold italic opacity-30">Aucun test trouvé</TableCell></TableRow>
              ) : tests.map((test) => (
                <TableRow key={test.id} className="border-muted/50 hover:bg-white/50 transition-colors cursor-pointer" onClick={() => handleViewDetails(test.id)}>
                  <TableCell className="pl-8"><Badge variant="outline" className="font-mono font-black text-[10px] bg-primary/5 border-primary/20">{test.code}</Badge></TableCell>
                  <TableCell className="font-black text-sm">{test.name}</TableCell>
                  <TableCell><Badge variant="secondary" className="text-[9px] font-black uppercase tracking-widest bg-muted/40 border-none">{typeLabel(test.testType)}</Badge></TableCell>
                  <TableCell className="font-black text-xs">{Number(test.price).toLocaleString()} FBU</TableCell>
                  <TableCell className="text-xs font-bold text-muted-foreground">{test.parameterCount} param.</TableCell>
                  <TableCell><Badge variant={test.isActive ? "default" : "secondary"} className="text-[9px] font-black uppercase tracking-widest">{test.isActive ? "Actif" : "Inactif"}</Badge></TableCell>
                  <TableCell className="pr-8 text-right">
                    <div className="flex justify-end gap-1" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="size-8 rounded-full" onClick={() => handleViewDetails(test.id)}><Microscope className="size-4" /></Button>
                      <Button variant="ghost" size="icon" className="size-8 rounded-full text-destructive" onClick={() => handleDeleteTest(test.id)}><Trash2 className="size-4" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={(open) => { setDetailOpen(open); if (!open) setDetailTest(null) }}>
        <DialogContent className="max-w-3xl rounded-[2rem] border-none shadow-2xl p-0 overflow-hidden max-h-[90vh] overflow-y-auto">
          {detailLoading ? (
            <div className="p-20 text-center"><Loader2 className="size-10 animate-spin mx-auto text-primary opacity-30" /></div>
          ) : detailTest && (
            <>
              <DialogHeader className="p-8 bg-primary text-primary-foreground sticky top-0 z-10">
                <DialogTitle className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                  <FlaskConical className="size-6" />
                  {detailTest.name}
                </DialogTitle>
                <DialogDescription className="text-primary-foreground/70 font-bold text-[10px] uppercase tracking-widest mt-1 flex items-center gap-3">
                  <span>Code: {detailTest.code}</span>
                  <span>•</span>
                  <span>{typeLabel(detailTest.testType)}</span>
                  <span>•</span>
                  <span>{Number(detailTest.price).toLocaleString()} FBU</span>
                </DialogDescription>
              </DialogHeader>

              <div className="p-8 space-y-6">
                {detailTest.description && (
                  <p className="text-sm text-muted-foreground font-medium">{detailTest.description}</p>
                )}

                <Separator />

                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
                    Paramètres ({detailTest.parameters?.length || 0})
                  </h3>
                  <Dialog open={editOpen} onOpenChange={setEditOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" className="rounded-full h-8 px-4 text-[9px] font-black uppercase tracking-widest">
                        <Plus className="size-3 mr-1" /> Ajouter
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md rounded-2xl border-none shadow-2xl p-6">
                      <DialogHeader className="mb-4">
                        <DialogTitle className="text-sm font-black uppercase">Nouveau Paramètre</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Code *</Label>
                            <Input className="h-9 rounded-xl text-xs font-bold uppercase" value={paramForm.parameterCode} onChange={e => setParamForm(f => ({ ...f, parameterCode: e.target.value.toUpperCase() }))} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Ordre</Label>
                            <Input type="number" className="h-9 rounded-xl text-xs font-bold" value={paramForm.sortOrder} onChange={e => setParamForm(f => ({ ...f, sortOrder: e.target.value }))} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Nom *</Label>
                          <Input className="h-9 rounded-xl text-xs font-bold" value={paramForm.parameterName} onChange={e => setParamForm(f => ({ ...f, parameterName: e.target.value }))} />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Unité *</Label>
                          <Input placeholder="Ex: g/dL, mmol/L" className="h-9 rounded-xl text-xs font-bold" value={paramForm.unit} onChange={e => setParamForm(f => ({ ...f, unit: e.target.value }))} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Réf. Basse</Label>
                            <Input type="number" step="any" className="h-9 rounded-xl text-xs font-bold" value={paramForm.referenceRangeLow} onChange={e => setParamForm(f => ({ ...f, referenceRangeLow: e.target.value }))} />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Réf. Haute</Label>
                            <Input type="number" step="any" className="h-9 rounded-xl text-xs font-bold" value={paramForm.referenceRangeHigh} onChange={e => setParamForm(f => ({ ...f, referenceRangeHigh: e.target.value }))} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Texte de Référence</Label>
                          <Input placeholder="Ex: Négatif, Clair..." className="h-9 rounded-xl text-xs font-bold" value={paramForm.referenceRangeText} onChange={e => setParamForm(f => ({ ...f, referenceRangeText: e.target.value }))} />
                        </div>
                      </div>
                      <DialogFooter className="mt-6 gap-2">
                        <Button variant="ghost" size="sm" className="rounded-full text-[9px] font-black uppercase tracking-widest" onClick={() => setEditOpen(false)}>Annuler</Button>
                        <Button size="sm" className="rounded-full text-[9px] font-black uppercase tracking-widest" onClick={handleAddParameter} disabled={saving}>
                          {saving ? <Loader2 className="size-3 animate-spin mr-1" /> : "Ajouter"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>

                {(!detailTest.parameters || detailTest.parameters.length === 0) ? (
                  <p className="text-sm text-muted-foreground italic">Aucun paramètre défini pour ce test.</p>
                ) : (
                  <div className="rounded-2xl border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/20">
                        <TableRow>
                          <TableHead className="font-black text-[9px] uppercase text-muted-foreground">Code</TableHead>
                          <TableHead className="font-black text-[9px] uppercase text-muted-foreground">Paramètre</TableHead>
                          <TableHead className="font-black text-[9px] uppercase text-muted-foreground">Unité</TableHead>
                          <TableHead className="font-black text-[9px] uppercase text-muted-foreground">Réf. Basse</TableHead>
                          <TableHead className="font-black text-[9px] uppercase text-muted-foreground">Réf. Haute</TableHead>
                          <TableHead className="font-black text-[9px] uppercase text-muted-foreground">Texte Réf.</TableHead>
                          <TableHead className="text-right font-black text-[9px] uppercase text-muted-foreground"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {detailTest.parameters.map((p: any) => (
                          <TableRow key={p.id} className="text-xs">
                            <TableCell className="font-mono font-bold">{p.parameterCode}</TableCell>
                            <TableCell className="font-bold">{p.parameterName}</TableCell>
                            <TableCell className="text-muted-foreground">{p.unit}</TableCell>
                            <TableCell>{p.referenceRangeLow || "—"}</TableCell>
                            <TableCell>{p.referenceRangeHigh || "—"}</TableCell>
                            <TableCell className="text-muted-foreground italic">{p.referenceRangeText || "—"}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="size-7 rounded-full text-destructive" onClick={() => handleDeleteParam(p.id)}>
                                <X className="size-3" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
