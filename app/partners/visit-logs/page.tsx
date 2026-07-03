"use client"

import { useEffect, useState } from "react"
import { Loader2, ClipboardList, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface VisitLog {
  id: string
  date: string
  partnerName: string
  employeeName: string
  visitId: string
  originalTotal: number
  discountApplied: number
  finalTotal: number
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR")
}

export default function VisitLogsPage() {
  const [data, setData] = useState<VisitLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 15

  useEffect(() => {
    fetchLogs()
  }, [page])

  async function fetchLogs() {
    setLoading(true)
    try {
      const res = await fetch(`/api/partners/visit-logs/list?page=${page}&limit=${limit}`)
      const result = await res.json()
      if (res.ok && result.success) {
        setData(result.data)
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages || 1)
        }
      } else {
        toast.error(result.error || "Erreur lors du chargement des visites")
      }
    } catch (err) {
      toast.error("Impossible de se connecter au serveur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Historique des Visites" description="Suivi des visites effectuées par les employés partenaires" />

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="size-10 animate-spin text-primary opacity-50" />
              <p className="text-muted-foreground font-bold text-sm animate-pulse">Chargement des visites...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-6">
              <div className="size-20 rounded-[2rem] bg-muted/30 flex items-center justify-center text-muted-foreground/40 border-2 border-dashed border-muted-foreground/20">
                <ClipboardList className="size-10" />
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-black tracking-tight">Aucune visite</h3>
                <p className="text-sm text-muted-foreground mt-1">Aucune visite n'a encore été enregistrée.</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest py-5">Date</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Partenaire</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Employé</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Visite</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Total Original</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Remise Appliquée</TableHead>
                  <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-widest py-5">Total Final</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((v) => (
                  <TableRow key={v.id} className="group hover:bg-muted/40 transition-colors border-muted/50">
                    <TableCell className="pl-8 py-5">
                      <p className="text-xs font-medium">{formatDate(v.date)}</p>
                    </TableCell>
                    <TableCell className="py-5">
                      <p className="text-xs font-black">{v.partnerName}</p>
                    </TableCell>
                    <TableCell className="py-5">
                      <p className="text-xs font-medium">{v.employeeName}</p>
                    </TableCell>
                    <TableCell className="py-5">
                      <Badge variant="secondary" className="rounded-lg font-mono text-[10px] font-black px-2 py-0.5 bg-muted/50 border-none">
                        {v.visitId}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5">
                      <p className="text-xs font-medium">{v.originalTotal.toLocaleString()} FCFA</p>
                    </TableCell>
                    <TableCell className="py-5">
                      <p className="text-xs font-medium text-green-600">-{v.discountApplied.toLocaleString()} FCFA</p>
                    </TableCell>
                    <TableCell className="text-right pr-8 py-5">
                      <p className="text-xs font-black">{v.finalTotal.toLocaleString()} FCFA</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {!loading && data.length > 0 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
            — Page {page} sur {totalPages} —
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full font-black text-xs"
              disabled={page <= 1}
              onClick={() => setPage(p => Math.max(1, p - 1))}
            >
              <ChevronLeft className="size-4 mr-1" />
              Précédent
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full font-black text-xs"
              disabled={page >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Suivant
              <ChevronRight className="size-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
