"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Search,
  Filter,
  FileText,
  User,
  Shield,
  Receipt,
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle,
  XCircle,
  ArrowUpRight,
  MoreVertical,
  ChevronRight,
  ShieldAlert
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { useRef } from "react"
import { BordereauA4 } from "@/components/insurances/bordereau-a4"

interface Claim {
  id: string
  status: 'pending' | 'submitted' | 'approved' | 'partially_approved' | 'denied' | 'paid'
  claimAmount: string
  approvedAmount: string
  deniedReason: string | null
  submittedAt: string
  paidAt: string | null
  createdAt: string
  insurance: {
    id: string
    name: string
  }
  patient: {
    id: string
    firstName: string
    lastName: string
  }
  invoice: {
    id: string
    invoiceNumber: string
  }
}

export default function ClaimsPage() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [isPrinting, setIsPrinting] = useState(false)
  const bordereauRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    async function fetchClaims() {
      try {
        const res = await fetch('/api/insurances/claims/list')
        const data = await res.json()
        if (data.success) {
          setClaims(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch claims:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchClaims()
  }, [])

  const handlePrintGlobal = () => {
    setIsPrinting(true)
    setTimeout(() => {
      window.print()
      setIsPrinting(false)
    }, 100)
  }

  const filteredClaims = useMemo(() => {
    return claims.filter(claim =>
      claim.invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${claim.patient.firstName} ${claim.patient.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      claim.insurance.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [claims, searchQuery])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-success text-success-foreground border-none uppercase text-[9px] font-black"><CheckCircle2 className="size-3 mr-1" /> Payé</Badge>
      case 'approved':
        return <Badge className="bg-success/10 text-success border-success/20 uppercase text-[9px] font-black"><CheckCircle2 className="size-3 mr-1" /> Approuvé</Badge>
      case 'submitted':
        return <Badge className="bg-primary/10 text-primary border-primary/20 uppercase text-[9px] font-black"><ArrowUpRight className="size-3 mr-1" /> Soumis</Badge>
      case 'pending':
        return <Badge className="bg-warning/10 text-warning border-warning/20 uppercase text-[9px] font-black"><Clock className="size-3 mr-1" /> En attente</Badge>
      case 'denied':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20 uppercase text-[9px] font-black"><XCircle className="size-3 mr-1" /> Rejeté</Badge>
      default:
        return <Badge variant="outline" className="uppercase text-[9px] font-black">{status}</Badge>
    }
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Gestion des Bordereaux"
        description="Suivi des réclamations auprès des compagnies d'assurance"
      />

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Rechercher par facture, patient ou assurance..."
            className="pl-12 h-12 rounded-2xl border-none shadow-sm bg-card/50 backdrop-blur-sm focus-visible:ring-primary"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline" className="h-12 px-6 rounded-2xl gap-2 border-none shadow-sm bg-card/50">
          <Filter className="size-4" />
          Filtrer
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-primary/5 border-none rounded-[2rem]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
              <Shield className="size-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Réclamé Total</p>
              <p className="text-xl font-black text-foreground">{claims.reduce((sum, c) => sum + Number(c.claimAmount), 0).toLocaleString()} <span className="text-xs font-normal">FBU</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-success/5 border-none rounded-[2rem]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-success/10 flex items-center justify-center text-success">
              <CheckCircle2 className="size-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Approuvé Total</p>
              <p className="text-xl font-black text-foreground">{claims.reduce((sum, c) => sum + Number(c.approvedAmount), 0).toLocaleString()} <span className="text-xs font-normal">FBU</span></p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-warning/5 border-none rounded-[2rem]">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="size-12 rounded-2xl bg-warning/10 flex items-center justify-center text-warning">
              <Clock className="size-6" />
            </div>
            <div>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Encours (Pending)</p>
              <p className="text-xl font-black text-foreground">{claims.filter(c => c.status === 'pending' || c.status === 'submitted').reduce((sum, c) => sum + Number(c.claimAmount), 0).toLocaleString()} <span className="text-xs font-normal">FBU</span></p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-xl bg-card/40 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="font-black text-xs uppercase tracking-wider pl-8 py-6">Réclamation / Date</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider py-6">Patient & Assurance</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider py-6 text-right">Montant Réclamé</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider py-6 text-right">Montant Approuvé</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider py-6 text-center">Statut</TableHead>
              <TableHead className="pr-8 py-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-b border-border/40">
                  <TableCell className="pl-8 py-4"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
                  <TableCell className="pr-8"><Skeleton className="size-8 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : filteredClaims.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-60 text-center text-muted-foreground italic">
                  Aucune réclamation trouvée.
                </TableCell>
              </TableRow>
            ) : (
              filteredClaims.map((claim) => (
                <TableRow key={claim.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors group">
                  <TableCell className="pl-8 py-5">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-foreground group-hover:text-primary transition-colors text-sm uppercase">#{claim.invoice.invoiceNumber}</span>
                        <Badge variant="outline" className="text-[8px] h-4 px-1 leading-none uppercase">ID: {claim.id.slice(0, 8)}</Badge>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground mt-1">
                        <Calendar className="size-3" />
                        {format(new Date(claim.createdAt), 'dd MMM yyyy', { locale: fr })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <User className="size-3 text-muted-foreground" />
                        <span className="font-bold text-sm tracking-tight">{claim.patient.firstName} {claim.patient.lastName}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Shield className="size-3 text-primary" />
                        <span className="text-[10px] font-black uppercase text-primary tracking-widest">{claim.insurance.name}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="text-sm font-black text-foreground">{Number(claim.claimAmount).toLocaleString()} FBU</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className={`text-sm font-black ${Number(claim.approvedAmount) > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                        {Number(claim.approvedAmount).toLocaleString()} FBU
                      </span>
                      {claim.deniedReason && (
                        <div className="flex items-center gap-1 text-[9px] text-destructive font-black uppercase">
                          <ShieldAlert className="size-2.5" /> Rejet: {claim.deniedReason}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(claim.status)}
                  </TableCell>
                  <TableCell className="pr-8 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary/10">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl w-48 shadow-2xl border-none">
                        <DropdownMenuItem className="rounded-xl gap-2 font-bold focus:bg-primary/10 cursor-pointer">
                          <ChevronRight className="size-4" /> Détails Facture
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl gap-2 font-bold focus:bg-primary/10 cursor-pointer">
                          <CheckCircle2 className="size-4" /> Approuver
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl gap-2 font-bold focus:bg-destructive/10 text-destructive cursor-pointer">
                          <XCircle className="size-4" /> Rejeter
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      <div className="flex justify-end pt-4">
        <Button
          className="rounded-2xl h-12 px-8 gap-2 font-black uppercase tracking-widest shadow-xl shadow-primary/20"
          onClick={handlePrintGlobal}
        >
          <FileText className="size-4" />
          Générer Bordereau Global
        </Button>
      </div>

      {/* Off-screen Bordereau container for print */}
      <div className="hidden print:block fixed inset-0 bg-white z-[9999]">
        <BordereauA4 claims={filteredClaims} ref={bordereauRef} />
      </div>
    </div>
  )
}