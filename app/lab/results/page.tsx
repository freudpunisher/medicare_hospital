"use client"

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { Search, Loader2, FlaskConical, ArrowRight, User, FileCheck, Clock, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { cn } from "@/lib/utils"

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  sample_collected: "Prélevé",
  in_analysis: "En analyse",
  results_entered: "Résultats saisis",
  validated: "Validé",
  cancelled: "Annulé",
}

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700 border-amber-200",
  sample_collected: "bg-blue-100 text-blue-700 border-blue-200",
  in_analysis: "bg-violet-100 text-violet-700 border-violet-200",
  results_entered: "bg-emerald-100 text-emerald-700 border-emerald-200",
  validated: "bg-green-100 text-green-700 border-green-200",
  cancelled: "bg-red-100 text-red-700 border-red-200",
}

export default function LabResultsPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  useEffect(() => {
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => setDebouncedSearch(search), 300)
    return () => clearTimeout(timerRef.current)
  }, [search])

  useEffect(() => { fetchOrders() }, [])

  async function fetchOrders() {
    setLoading(true)
    try {
      const res = await fetch("/api/lab/orders?limit=200")
      const json = await res.json()
      if (res.ok) setOrders(json.data || [])
    } catch { }
    finally { setLoading(false) }
  }

  const q = debouncedSearch.toLowerCase()
  const filtered = orders.filter(o =>
    !q ||
    `${o.patient?.firstName} ${o.patient?.lastName}`.toLowerCase().includes(q) ||
    o.orderNumber?.toLowerCase().includes(q) ||
    o.labTest?.name?.toLowerCase().includes(q) ||
    o.labTest?.code?.toLowerCase().includes(q)
  )

  const total = orders.length
  const pending = orders.filter(o => o.status === "pending" || o.status === "sample_collected" || o.status === "in_analysis").length
  const completed = orders.filter(o => o.status === "results_entered" || o.status === "validated").length

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader
        title="Résultats de Laboratoire"
        description="Rechercher et consulter les résultats d'analyses"
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center"><FlaskConical className="size-5 text-primary" /></div>
            <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total</p><p className="text-xl font-black">{total}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-amber-500/20 flex items-center justify-center"><Clock className="size-5 text-amber-600" /></div>
            <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">En cours</p><p className="text-xl font-black">{pending}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"><FileCheck className="size-5 text-emerald-600" /></div>
            <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Terminées</p><p className="text-xl font-black">{completed}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-blue-500/20 flex items-center justify-center"><Search className="size-5 text-blue-600" /></div>
            <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Résultats</p><p className="text-xl font-black">{filtered.length}</p></div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par patient, test, n° commande..."
          className="pl-11 h-12 rounded-2xl bg-background border-input font-bold text-sm"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {/* Results */}
      <Card className="rounded-[2rem] border-none shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-20 text-center"><Loader2 className="size-8 animate-spin mx-auto text-primary/30" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-20 text-center text-muted-foreground">
              <FlaskConical className="size-12 mx-auto mb-4 opacity-20" />
              <p className="font-bold">{search ? "Aucun résultat trouvé" : "Aucune analyse enregistrée"}</p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map(order => (
                <Link
                  key={order.id}
                  href={`/lab/orders/${order.id}`}
                  className="flex items-center gap-4 p-5 hover:bg-muted/50 transition-colors group"
                >
                  <div className="size-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-muted-foreground">
                      {order.patient?.firstName?.[0]}{order.patient?.lastName?.[0]}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-black text-sm">
                        {order.patient?.firstName} {order.patient?.lastName}
                      </span>
                      <Badge variant="outline" className="text-[9px] font-mono border-border">{order.orderNumber}</Badge>
                      <Badge className={`text-[9px] font-black uppercase tracking-widest border px-2 py-0.5 ${STATUS_COLORS[order.status]}`}>
                        {STATUS_LABELS[order.status] || order.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground font-bold mt-0.5">
                      {order.labTest?.name} <span className="text-muted-foreground/50">•</span> {order.labTest?.code}
                    </p>
                  </div>
                  <ArrowRight className="size-5 text-muted-foreground/30 group-hover:text-primary transition-colors shrink-0" />
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
