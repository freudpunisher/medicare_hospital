"use client"

import { useState, useEffect, useMemo } from "react"
import {
  Search,
  Filter,
  History,
  Banknote,
  Shield,
  Calendar,
  CheckCircle2,
  MoreVertical,
  Fingerprint,
  FileText,
  CreditCard,
  Building2
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

interface Payment {
  id: string
  amount: string
  paymentDate: string
  referenceNumber: string | null
  notes: string | null
  createdAt: string
  insurance: {
    id: string
    name: string
  }
  claim: {
    id: string
    status: string
  }
}

export default function InsurancePaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await fetch('/api/insurances/payments/list')
        const data = await res.json()
        if (data.success) {
          setPayments(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch insurance payments:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [])

  const filteredPayments = useMemo(() => {
    return payments.filter(p =>
      p.insurance.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.referenceNumber && p.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  }, [payments, searchQuery])

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Règlements Assurances"
        description="Historique des paiements reçus des tiers payeurs"
      />

      <div className="flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Rechercher par référence ou nom d'assurance..."
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

      <div className="bg-gradient-to-br from-primary/10 to-transparent p-8 rounded-[3rem] flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-6">
          <div className="size-16 rounded-[2rem] bg-white flex items-center justify-center text-primary shadow-xl rotate-3">
            <Banknote className="size-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-foreground tracking-tight leading-none uppercase">Règlements Encaissés</h2>
            <p className="text-sm text-muted-foreground mt-2 font-medium italic">Trésorerie provenant des mutuelles & assurances</p>
          </div>
        </div>
        <div className="text-right flex flex-col gap-1">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Total Période</span>
          <div className="text-4xl font-black text-primary">
            {payments.reduce((sum, p) => sum + Number(p.amount), 0).toLocaleString()}
            <span className="text-sm font-normal ml-2">FBU</span>
          </div>
        </div>
      </div>

      <Card className="rounded-[2.5rem] border-none shadow-xl bg-card/40 backdrop-blur-md overflow-hidden">
        <Table>
          <TableHeader className="bg-muted/30">
            <TableRow className="border-none hover:bg-transparent">
              <TableHead className="font-black text-xs uppercase tracking-wider pl-8 py-6">Date du Paiement</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider py-6">Compagnie d'Assurance</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider py-6">Référence / Bordereau</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider py-6 text-right">Montant Reçu</TableHead>
              <TableHead className="font-black text-xs uppercase tracking-wider py-6 text-center">Statut Bordereau</TableHead>
              <TableHead className="pr-8 py-6"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i} className="border-b border-border/40">
                  <TableCell className="pl-8 py-4"><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                  <TableCell className="text-center"><Skeleton className="h-6 w-16 mx-auto rounded-full" /></TableCell>
                  <TableCell className="pr-8"><Skeleton className="size-8 rounded-full" /></TableCell>
                </TableRow>
              ))
            ) : filteredPayments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-60 text-center text-muted-foreground italic">
                  Aucun règlement enregistré.
                </TableCell>
              </TableRow>
            ) : (
              filteredPayments.map((p) => (
                <TableRow key={p.id} className="border-b border-border/40 hover:bg-muted/20 transition-colors group">
                  <TableCell className="pl-8 py-6">
                    <div className="flex items-center gap-3">
                      <Calendar className="size-4 text-muted-foreground" />
                      <span className="font-bold text-sm tracking-tight italic">
                        {format(new Date(p.paymentDate), 'dd MMMM yyyy', { locale: fr })}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="size-10 rounded-2xl bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                        <Building2 className="size-5" />
                      </div>
                      <span className="font-black text-sm uppercase tracking-tight">{p.insurance.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <CreditCard className="size-3 text-muted-foreground" />
                        <span className="text-xs font-black text-foreground">Ref: {p.referenceNumber || 'N/A'}</span>
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase opacity-60">ID Bordereau: {p.claim.id.slice(0, 8)}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-base font-black text-primary">
                        {Number(p.amount).toLocaleString()}
                      </span>
                      <span className="text-[9px] font-bold text-muted-foreground italic">Fonds Reçus (FBU)</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20 uppercase text-[9px] font-black px-3 py-1 rounded-full">
                      {p.claim.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="pr-8 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-full">
                          <MoreVertical className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-2xl w-48 shadow-2xl border-none">
                        <DropdownMenuItem className="rounded-xl gap-2 font-bold focus:bg-primary/10 cursor-pointer">
                          <FileText className="size-4" /> Justificatif
                        </DropdownMenuItem>
                        <DropdownMenuItem className="rounded-xl gap-2 font-bold focus:bg-primary/10 cursor-pointer">
                          <History className="size-4" /> Détails Claim
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
    </div>
  )
}