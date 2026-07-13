"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { FlaskConical, ClipboardList, Clock, CheckCircle2, Loader2, ArrowRight, AlertCircle, Microscope } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import { Separator } from "@/components/ui/separator"

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

export default function LabDashboard() {
  const [stats, setStats] = useState({ pending: 0, inAnalysis: 0, today: 0, total: 0 })
  const [recentOrders, setRecentOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [pendingRes, analysisRes, todayRes, allRes, recentRes] = await Promise.all([
          fetch("/api/lab/orders?status=pending"),
          fetch("/api/lab/orders?status=in_analysis"),
          fetch("/api/lab/orders?status=all&limit=100"),
          fetch("/api/lab/orders?status=all"),
          fetch("/api/lab/orders?status=all"),
        ])

        const pending = await pendingRes.json()
        const analysis = await analysisRes.json()
        const todayData = await todayRes.json()
        const allData = await allRes.json()
        const recent = await recentRes.json()

        const todayStart = new Date()
        todayStart.setHours(0, 0, 0, 0)

        setStats({
          pending: pending.data?.length || 0,
          inAnalysis: analysis.data?.length || 0,
          today: (todayData.data || []).filter((o: any) => new Date(o.createdAt) >= todayStart).length,
          total: allData.data?.length || 0,
        })
        setRecentOrders((recent.data || []).slice(0, 10))
      } catch (err) {
        console.error("Failed to load lab dashboard", err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Laboratoire" description="Pilotage des activités du laboratoire">
        <div className="flex gap-2">
          <Link href="/lab/orders">
            <Button className="rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
              <ClipboardList className="size-4 mr-2" />Toutes les Demandes
            </Button>
          </Link>
          <Link href="/lab/tests">
            <Button variant="outline" className="rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest">
              <FlaskConical className="size-4 mr-2" />Catalogue
            </Button>
          </Link>
        </div>
      </PageHeader>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-amber-500/20 flex items-center justify-center"><Clock className="size-5 text-amber-600" /></div>
            <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">En Attente</p><p className="text-2xl font-black text-amber-600">{loading ? "..." : stats.pending}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-violet-500/10 to-violet-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-violet-500/20 flex items-center justify-center"><Microscope className="size-5 text-violet-600" /></div>
            <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">En Analyse</p><p className="text-2xl font-black text-violet-600">{loading ? "..." : stats.inAnalysis}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"><CheckCircle2 className="size-5 text-emerald-600" /></div>
            <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Aujourd'hui</p><p className="text-2xl font-black text-emerald-600">{loading ? "..." : stats.today}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-primary/20 flex items-center justify-center"><FlaskConical className="size-5 text-primary" /></div>
            <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Total</p><p className="text-2xl font-black">{loading ? "..." : stats.total}</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Pending Orders */}
        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <AlertCircle className="size-4 text-amber-500" />
              Demandes en Attente
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center"><Loader2 className="size-6 animate-spin mx-auto text-primary opacity-30" /></div>
            ) : recentOrders.filter(o => o.status === "pending").length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-8 text-center">Aucune demande en attente</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.filter(o => o.status === "pending").slice(0, 5).map((order) => (
                  <Link key={order.id} href={`/lab/orders/${order.id}`} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group">
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{order.patient?.firstName} {order.patient?.lastName}</p>
                      <p className="text-[10px] text-muted-foreground">{order.labTest?.name}</p>
                    </div>
                    <ArrowRight className="size-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="rounded-[2rem] border-none shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
              <Clock className="size-4" />
              Dernières Demandes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="py-8 text-center"><Loader2 className="size-6 animate-spin mx-auto text-primary opacity-30" /></div>
            ) : recentOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground italic py-8 text-center">Aucune demande récente</p>
            ) : (
              <div className="space-y-2">
                {recentOrders.map((order) => (
                  <Link key={order.id} href={`/lab/orders/${order.id}`} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group">
                    <div className="min-w-0">
                      <p className="text-xs font-bold truncate">{order.patient?.firstName} {order.patient?.lastName}</p>
                      <p className="text-[10px] text-muted-foreground">{order.labTest?.name}</p>
                    </div>
                    <Badge className={`text-[8px] font-black uppercase tracking-widest border ${STATUS_COLORS[order.status] || ''}`}>
                      {STATUS_LABELS[order.status] || order.status}
                    </Badge>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
