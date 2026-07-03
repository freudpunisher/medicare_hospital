"use client"

import { useEffect, useState } from "react"
import { Loader2, Percent, ChevronLeft, ChevronRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

interface DiscountLog {
  id: string
  partnerName: string
  invoiceItemId: string
  originalPrice: number
  discountedPrice: number
  discountAmount: number
  discountType: string
  ruleId: string | null
}

export default function DiscountHistoryPage() {
  const [data, setData] = useState<DiscountLog[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const limit = 15

  useEffect(() => {
    fetchDiscounts()
  }, [page])

  async function fetchDiscounts() {
    setLoading(true)
    try {
      const res = await fetch(`/api/partners/discounts/list?page=${page}&limit=${limit}`)
      const result = await res.json()
      if (res.ok && result.success) {
        setData(result.data)
        if (result.pagination) {
          setTotalPages(result.pagination.totalPages || 1)
        }
      } else {
        toast.error(result.error || "Erreur lors du chargement des remises")
      }
    } catch (err) {
      toast.error("Impossible de se connecter au serveur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader title="Historique des Remises" description="Détail des remises appliquées par les conventions partenaires" />

      <Card className="rounded-[2.5rem] border-none shadow-sm overflow-hidden bg-card/60 backdrop-blur-xl">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <Loader2 className="size-10 animate-spin text-primary opacity-50" />
              <p className="text-muted-foreground font-bold text-sm animate-pulse">Chargement des remises...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-6">
              <div className="size-20 rounded-[2rem] bg-muted/30 flex items-center justify-center text-muted-foreground/40 border-2 border-dashed border-muted-foreground/20">
                <Percent className="size-10" />
              </div>
              <div className="max-w-xs">
                <h3 className="text-lg font-black tracking-tight">Aucune remise</h3>
                <p className="text-sm text-muted-foreground mt-1">Aucune remise n'a encore été appliquée.</p>
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="pl-8 font-black text-[10px] uppercase tracking-widest py-5">Partenaire</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Ligne de Facture</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Prix Original</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Prix Remisé</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Montant Remisé</TableHead>
                  <TableHead className="font-black text-[10px] uppercase tracking-widest py-5">Type de Remise</TableHead>
                  <TableHead className="text-right pr-8 font-black text-[10px] uppercase tracking-widest py-5">Règle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((d) => (
                  <TableRow key={d.id} className="group hover:bg-muted/40 transition-colors border-muted/50">
                    <TableCell className="pl-8 py-5">
                      <p className="text-xs font-black">{d.partnerName}</p>
                    </TableCell>
                    <TableCell className="py-5">
                      <Badge variant="secondary" className="rounded-lg font-mono text-[10px] font-black px-2 py-0.5 bg-muted/50 border-none">
                        {d.invoiceItemId}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-5">
                      <p className="text-xs font-medium">{d.originalPrice.toLocaleString()} FCFA</p>
                    </TableCell>
                    <TableCell className="py-5">
                      <p className="text-xs font-medium">{d.discountedPrice.toLocaleString()} FCFA</p>
                    </TableCell>
                    <TableCell className="py-5">
                      <p className="text-xs font-black text-green-600">-{d.discountAmount.toLocaleString()} FCFA</p>
                    </TableCell>
                    <TableCell className="py-5">
                      <Badge variant="outline" className="rounded-full font-black text-[10px] px-2.5 py-0.5 bg-background/50 border-muted/50">
                        {d.discountType === "percentage" ? "Pourcentage" : d.discountType === "fixed_amount" ? "Montant Fixe" : d.discountType}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right pr-8 py-5">
                      <p className="text-[10px] font-mono text-muted-foreground">{d.ruleId ? d.ruleId.slice(0, 8) + "..." : <span className="opacity-30 italic">—</span>}</p>
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
