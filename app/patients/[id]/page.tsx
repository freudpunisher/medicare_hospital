"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import {
    ArrowLeft,
    Edit,
    Phone,
    MapPin,
    Calendar,
    Shield,
    FileText,
    User,
    Mail,
    Clock,
    Activity,
    CreditCard,
    Hash
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PageHeader } from "@/components/page-header"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table"
import { toast } from "sonner"
import { cn } from "@/lib/utils"

interface PatientDetail {
    id: string
    patientNumber: number
    firstName: string
    lastName: string
    dateOfBirth: string
    gender: string
    phone: string
    address: string | null
    isInsured: boolean
    createdAt: string
    quartier?: {
        name: string
        zone?: {
            name: string
            commune?: {
                name: string
                province?: {
                    name: string
                }
            }
        }
    }
    insurances: Array<{
        insurance: {
            name: string
        }
        insuranceNumber: string | null
        insuranceCardNumber: string | null
        insuranceExpiryDate: string | null
        coverageRate: string
        isPrimary: boolean
    }>
}

export default function PatientDetailPage() {
    const router = useRouter()
    const params = useParams<{ id: string }>()
    const patientId = params.id
    const [loading, setLoading] = useState(true)
    const [patient, setPatient] = useState<PatientDetail | null>(null)
    const [invoices, setInvoices] = useState<any[]>([])

    useEffect(() => {
        if (patientId) {
            fetchPatientData()
            fetchPatientInvoices()
        }
    }, [patientId])

    async function fetchPatientData() {
        try {
            const res = await fetch(`/api/patients/${patientId}`)
            const data = await res.json()
            if (res.ok) {
                setPatient(data)
            } else {
                toast.error("Impossible de charger les données du patient")
            }
        } catch (err) {
            console.error(err)
            toast.error("Erreur lors du chargement des données")
        } finally {
            setLoading(false)
        }
    }

    async function fetchPatientInvoices() {
        try {
            // Note: Reusing the existing list API and filtering for now
            // in a real app, you'd have a specific /api/patients/:id/invoices endpoint
            const res = await fetch(`/api/billing/invoices/list`)
            const data = await res.json()
            if (res.ok && data.success) {
                const patientInvoices = data.data.filter((inv: any) => inv.patient.id === patientId)
                setInvoices(patientInvoices)
            }
        } catch (err) {
            console.error("Failed to fetch invoices", err)
        }
    }

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground animate-pulse">Chargement du dossier patient...</div>
    }

    if (!patient) {
        return (
            <div className="p-8 text-center space-y-4">
                <p className="text-xl font-semibold">Patient non trouvé</p>
                <Button variant="outline" onClick={() => router.push("/patients")}>
                    Retour à la liste
                </Button>
            </div>
        )
    }

    const locationStr = [
        patient.quartier?.name,
        patient.quartier?.zone?.name,
        patient.quartier?.zone?.commune?.name,
        patient.quartier?.zone?.commune?.province?.name
    ].filter(Boolean).join(", ")

    return (
        <div className="p-6 space-y-6 max-w-7xl mx-auto">
            {/* Header with Navigation and Quick Actions */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" className="rounded-full bg-background shadow-sm border" asChild>
                        <Link href="/patients">
                            <ArrowLeft className="size-5" />
                        </Link>
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black tracking-tight text-foreground">
                                {patient.firstName} {patient.lastName}
                            </h1>
                            {patient.isInsured ? (
                                <Badge className="bg-primary/10 text-primary border-none text-[10px] uppercase font-black px-2 py-0.5">
                                    Assuré
                                </Badge>
                            ) : (
                                <Badge variant="outline" className="text-muted-foreground text-[10px] uppercase font-black px-2 py-0.5">
                                    Non Assuré
                                </Badge>
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground font-medium mt-1">
                            ID Patient: <Badge variant="outline" className="font-black text-xs px-2 py-0.5 bg-muted/30 ml-1">#{patient.patientNumber}</Badge> • Inscrit le {new Date(patient.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" className="rounded-full shadow-sm" asChild>
                        <Link href={`/patients/${patient.id}/edit`}>
                            <Edit className="size-4 mr-2" />
                            Modifier le dossier
                        </Link>
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Sidebar Mini Profile */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
                        <CardHeader className="bg-primary/5 pb-8 pt-10 text-center">
                            <div className="mx-auto size-24 rounded-full bg-primary/10 flex items-center justify-center mb-4 border-4 border-background shadow-xl">
                                <User className="size-12 text-primary" />
                            </div>
                            <CardTitle className="text-xl font-black">{patient.firstName} {patient.lastName}</CardTitle>
                            <CardDescription className="text-primary font-bold uppercase tracking-widest text-[10px]">Profil Patient</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6 pt-8 space-y-5">
                            <div className="flex items-center gap-4 group">
                                <div className="size-9 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-600 transition-colors group-hover:bg-orange-500/20">
                                    <Phone className="size-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase">Téléphone</p>
                                    <p className="text-sm font-bold">{patient.phone}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 group">
                                <div className="size-9 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 transition-colors group-hover:bg-blue-500/20">
                                    <Mail className="size-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase">Genre & Âge</p>
                                    <p className="text-sm font-bold">
                                        {patient.gender === 'Male' ? 'Homme' : 'Femme'} • {new Date().getFullYear() - new Date(patient.dateOfBirth).getFullYear()} ans
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 group">
                                <div className="size-9 rounded-xl bg-green-500/10 flex items-center justify-center text-green-600 transition-colors group-hover:bg-green-500/20">
                                    <Calendar className="size-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase">Né(e) le</p>
                                    <p className="text-sm font-bold">{new Date(patient.dateOfBirth).toLocaleDateString('fr-FR')}</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 group pt-2">
                                <div className="size-9 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 transition-colors group-hover:bg-purple-500/20 shrink-0">
                                    <MapPin className="size-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] text-muted-foreground font-black uppercase tracking-tighter">Localisation</p>
                                    <p className="text-sm font-bold leading-tight">{locationStr || "Non spécifié"}</p>
                                    {patient.address && (
                                        <p className="text-xs text-muted-foreground mt-1 italic">"{patient.address}"</p>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats/Badges */}
                    <Card className="rounded-[2rem] border-none shadow-sm bg-gradient-to-br from-primary/10 to-primary/5">
                        <CardContent className="p-6">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-primary mb-4">Statistiques Express</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="bg-background/40 backdrop-blur-md p-3 rounded-2xl">
                                    <p className="text-[20px] font-black text-primary leading-none">{invoices.length}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 leading-none">Factures</p>
                                </div>
                                <div className="bg-background/40 backdrop-blur-md p-3 rounded-2xl">
                                    <p className="text-[20px] font-black text-green-600 leading-none">{invoices.filter(i => i.status === 'paid').length}</p>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1 leading-none">Payées</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content Area */}
                <div className="lg:col-span-8">
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="bg-muted/50 p-1 rounded-2xl mb-6 w-full md:w-auto h-auto flex flex-wrap">
                            <TabsTrigger value="overview" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider">Aperçu</TabsTrigger>
                            <TabsTrigger value="billing" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider">Facturation</TabsTrigger>
                            <TabsTrigger value="medical" className="rounded-xl px-6 py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm font-bold text-xs uppercase tracking-wider">Historique Médical</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6">
                            {/* Insurance Info Card */}
                            <Card className="rounded-[2.5rem] border-none shadow-sm h-full">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl font-black">Informations d'Assurance</CardTitle>
                                            <CardDescription>Détails des couvertures actives</CardDescription>
                                        </div>
                                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                            <Shield className="size-6" />
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {!patient.isInsured ? (
                                        <div className="p-8 text-center rounded-[2rem] border-2 border-dashed bg-muted/20">
                                            <p className="text-muted-foreground font-medium italic">Aucune assurance active enregistrée pour ce patient.</p>
                                            <Button variant="link" className="mt-2 text-primary font-bold" asChild>
                                                <Link href={`/patients/${patient.id}/edit`}>Ajouter une assurance</Link>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {patient.insurances.map((ins, idx) => (
                                                <div key={idx} className={cn(
                                                    "p-5 rounded-[2rem] border-2 relative group overflow-hidden transition-all hover:shadow-lg",
                                                    ins.isPrimary ? "bg-primary/5 border-primary/20" : "bg-card border-muted/50"
                                                )}>
                                                    {ins.isPrimary && (
                                                        <Badge className="absolute top-4 right-4 bg-primary text-primary-foreground font-black text-[8px] uppercase">Primaire</Badge>
                                                    )}
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="size-10 rounded-2xl bg-background flex items-center justify-center text-primary shadow-sm border border-primary/10">
                                                            <Shield className="size-5" />
                                                        </div>
                                                        <p className="font-black text-lg tracking-tight">{ins.insurance.name}</p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-4 text-xs">
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground uppercase font-black">Police n°</p>
                                                            <p className="font-bold font-mono">{ins.insuranceNumber || "—"}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground uppercase font-black">Carte n°</p>
                                                            <p className="font-bold font-mono">{ins.insuranceCardNumber || "—"}</p>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground uppercase font-black">Couverture</p>
                                                            <Badge variant="outline" className="font-black bg-success/10 text-success border-none text-[10px]">{ins.coverageRate}%</Badge>
                                                        </div>
                                                        <div>
                                                            <p className="text-[10px] text-muted-foreground uppercase font-black">Expire le</p>
                                                            <p className="font-bold">{ins.insuranceExpiryDate ? new Date(ins.insuranceExpiryDate).toLocaleDateString('fr-FR') : "Permanent"}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            {/* Recent Invoices Preview */}
                            <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="text-xl font-black">Dernières Factures</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {invoices.length === 0 ? (
                                        <div className="p-12 text-center text-muted-foreground italic">Aucune facture enregistrée.</div>
                                    ) : (
                                        <Table>
                                            <TableHeader className="bg-muted/30">
                                                <TableRow>
                                                    <TableHead className="pl-6 font-black text-[10px] uppercase">N° Facture</TableHead>
                                                    <TableHead className="font-black text-[10px] uppercase">Date</TableHead>
                                                    <TableHead className="font-black text-[10px] uppercase">Total</TableHead>
                                                    <TableHead className="font-black text-[10px] uppercase">Statut</TableHead>
                                                    <TableHead className="text-right pr-6 font-black text-[10px] uppercase">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {invoices.slice(0, 5).map((inv) => (
                                                    <TableRow key={inv.id} className="group hover:bg-muted/40 transition-colors border-muted/50">
                                                        <TableCell className="pl-6 font-mono text-[11px] font-bold">{inv.invoiceNumber}</TableCell>
                                                        <TableCell className="text-xs font-medium text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                                                        <TableCell className="font-black text-[13px]">{inv.totalAmount.toLocaleString()} FBU</TableCell>
                                                        <TableCell>
                                                            <Badge
                                                                variant="outline"
                                                                className={cn(
                                                                    "rounded-full px-2 py-0.5 border-none text-[9px] font-black uppercase tracking-tight",
                                                                    inv.status === 'paid' ? "bg-success/10 text-success" :
                                                                        inv.status === 'partial' ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                                                                )}
                                                            >
                                                                {inv.status === 'paid' ? 'Payée' : inv.status === 'partial' ? 'Partiel' : 'En attente'}
                                                            </Badge>
                                                        </TableCell>
                                                        <TableCell className="text-right pr-6">
                                                            <Button variant="ghost" size="icon" className="rounded-full size-8 opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                                                                <Link href={`/billing/invoices/${inv.id}`}>
                                                                    <FileText className="size-4" />
                                                                </Link>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    )}
                                    {invoices.length > 5 && (
                                        <div className="p-4 text-center bg-muted/20">
                                            <Button variant="link" className="text-primary font-black uppercase text-[10px]" onClick={() => (window as any).location.hash = "#billing"}>
                                                Voir toutes les factures ({invoices.length})
                                            </Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="billing" className="space-y-6">
                            <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden">
                                <CardHeader className="flex flex-row items-center justify-between">
                                    <CardTitle className="text-xl font-black">Historique de Facturation</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <Table>
                                        <TableHeader className="bg-muted/30">
                                            <TableRow>
                                                <TableHead className="pl-6 font-black text-[10px] uppercase">Référence</TableHead>
                                                <TableHead className="font-black text-[10px] uppercase">Date</TableHead>
                                                <TableHead className="font-black text-[10px] uppercase">Montant Total</TableHead>
                                                <TableHead className="font-black text-[10px] uppercase">Part Patient</TableHead>
                                                <TableHead className="font-black text-[10px] uppercase">Part Assurance</TableHead>
                                                <TableHead className="font-black text-[10px] uppercase">Statut</TableHead>
                                                <TableHead className="text-right pr-6 font-black text-[10px] uppercase">Action</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {invoices.map((inv) => (
                                                <TableRow key={inv.id} className="group hover:bg-muted/40 transition-colors border-muted/50">
                                                    <TableCell className="pl-6 font-mono text-[11px] font-bold">{inv.invoiceNumber}</TableCell>
                                                    <TableCell className="text-xs font-medium text-muted-foreground">{new Date(inv.createdAt).toLocaleDateString('fr-FR')}</TableCell>
                                                    <TableCell className="font-black text-[13px]">{inv.totalAmount.toLocaleString()} FBU</TableCell>
                                                    <TableCell className="text-[12px] font-bold text-muted-foreground">{inv.patientAmount.toLocaleString()} FBU</TableCell>
                                                    <TableCell className="text-[12px] font-bold text-primary/70">{inv.insuranceAmount.toLocaleString()} FBU</TableCell>
                                                    <TableCell>
                                                        <Badge
                                                            variant="outline"
                                                            className={cn(
                                                                "rounded-full px-2 py-0.5 border-none text-[9px] font-black uppercase tracking-tight",
                                                                inv.status === 'paid' ? "bg-success/10 text-success" :
                                                                    inv.status === 'partial' ? "bg-warning/10 text-warning" : "bg-destructive/10 text-destructive"
                                                            )}
                                                        >
                                                            {inv.status === 'paid' ? 'Payée' : inv.status === 'partial' ? 'Partiel' : 'En attente'}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right pr-6">
                                                        <Button variant="ghost" size="icon" className="rounded-full size-8" asChild>
                                                            <Link href={`/billing/invoices/${inv.id}`}>
                                                                <FileText className="size-4" />
                                                            </Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                            {invoices.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={7} className="h-40 text-center text-muted-foreground italic">
                                                        Aucun historique de facturation trouvé.
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="medical" className="space-y-6">
                            <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden">
                                <CardHeader>
                                    <CardTitle className="text-xl font-black flex items-center gap-2">
                                        <Activity className="size-6 text-primary" />
                                        Parcours Patient
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    <div className="p-12 text-center space-y-6">
                                        <div className="mx-auto size-20 rounded-3xl bg-muted/30 flex items-center justify-center text-muted-foreground/40 border-2 border-dashed border-muted-foreground/20">
                                            <Clock className="size-10" />
                                        </div>
                                        <div className="max-w-xs mx-auto">
                                            <p className="text-muted-foreground font-bold text-sm">Le dossier médical complet (Triage, Consultations, Diagnostics) est actuellement géré via les modules cliniques.</p>
                                            <p className="text-xs text-muted-foreground/70 mt-2">Bientôt, un résumé clinique complet sera disponible dans cet onglet.</p>
                                        </div>
                                        <Button variant="outline" className="rounded-full font-bold shadow-sm" disabled>
                                            Voir le Carnet de Santé
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    )
}
