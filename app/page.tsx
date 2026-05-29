"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users, UserCog, Activity, Layers, Receipt,
  TrendingUp, TrendingDown, DollarSign,
  AlertTriangle, Package, Calendar, ArrowRight,
  Pill, History, Settings, ShoppingBag
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { Skeleton } from "@/components/ui/skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"

interface DashboardStats {
  kpis: { title: string; value: number; trend: string; change: string; icon?: any }[]
  financials: {
    totalIncome: number
    moneyOwed: number
    expiringCount: number
    netResult: number
  }
  popularActs: { id: string; name: string; usageCount: number }[]
  recentInvoices: any[]
  monthlyRevenue: { month: string; revenue: number }[]
  invoiceStatus: { name: string; value: number }[]
}

const PIE_COLORS = [
  "oklch(0.60 0.17 145)",
  "oklch(0.75 0.15 80)",
  "oklch(0.50 0.20 27)", // Destructive/Red
]

const ICON_MAP: Record<string, any> = {
  "Total Patients": Users,
  "Active Doctors": UserCog,
  "Active Acts": Activity,
  "Active Services": Layers,
  "Total Invoices": Receipt,
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/dashboard/stats')
        const data = await res.json()
        setStats(data)
      } catch (error) {
        console.error('Failed to fetch dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="h-20 w-1/3 bg-muted animate-pulse rounded-2xl" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-[400px] rounded-2xl" />
      </div>
    )
  }

  if (!stats) return <div className="p-6">Failed to load dashboard data.</div>

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Dashboard"
        description="Aperçu en temps réel de votre établissement"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {stats.kpis.map((kpi) => {
          const Icon = ICON_MAP[kpi.title] || Activity
          return (
            <Card key={kpi.title} className="rounded-[2rem] border-none shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="size-5 text-primary" />
                  </div>
                  <Badge variant="secondary" className="bg-success/10 text-success border-none text-[10px]">
                    {kpi.change}
                  </Badge>
                </div>
                <div className="mt-3">
                  <p className="text-2xl font-bold text-foreground">
                    {kpi.value.toLocaleString()}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">{kpi.title}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Financial Summary & Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-success/5 border-none rounded-[2rem]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-success/10">
                <TrendingUp className="size-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Encaissé</p>
                <p className="text-xl font-black text-foreground">
                  {stats.financials.totalIncome.toLocaleString()} <span className="text-xs font-normal">FBU</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-warning/5 border-none rounded-[2rem]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-warning/10">
                <DollarSign className="size-5 text-warning" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Dettes Clients/Assurances</p>
                <p className="text-xl font-black text-foreground">
                  {stats.financials.moneyOwed.toLocaleString()} <span className="text-xs font-normal">FBU</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className={cn(
          "border-none rounded-[2rem]",
          stats.financials.expiringCount > 0 ? "bg-destructive/5" : "bg-primary/5"
        )}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className={cn(
                "flex size-10 items-center justify-center rounded-xl",
                stats.financials.expiringCount > 0 ? "bg-destructive/10" : "bg-primary/10"
              )}>
                <AlertTriangle className={cn("size-5", stats.financials.expiringCount > 0 ? "text-destructive" : "text-primary")} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Médicaments à Expirer (3m)</p>
                <p className={cn("text-xl font-black", stats.financials.expiringCount > 0 ? "text-destructive" : "text-foreground")}>
                  {stats.financials.expiringCount} <span className="text-xs font-normal">Lots</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-none rounded-[2rem]">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                <Activity className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Rentabilité Nette</p>
                <p className="text-xl font-black text-foreground">
                  {stats.financials.netResult.toLocaleString()} <span className="text-xs font-normal">FBU</span>
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Analysis Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2 rounded-[2.5rem] border-none shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <TrendingUp className="size-5 text-primary" />
              Évolution du Chiffre d'Affaire
            </CardTitle>
            <CardDescription>Cumul Pharmacie + Facturation Patient</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis
                    dataKey="month"
                    className="text-xs"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "oklch(0.50 0.02 240)" }}
                  />
                  <YAxis
                    className="text-xs"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "oklch(0.50 0.02 240)" }}
                  />
                  <Tooltip
                    cursor={{ fill: 'transparent' }}
                    contentStyle={{
                      backgroundColor: "oklch(1 0 0)",
                      border: "none",
                      borderRadius: "15px",
                      boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.1)",
                      fontSize: "12px",
                      fontWeight: "bold"
                    }}
                    formatter={(value: number) => [`${value.toLocaleString()} FBU`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="oklch(0.55 0.15 240)" radius={[10, 10, 10, 10]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Invoice Status Distribution */}
        <Card className="rounded-[2.5rem] border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-black">État de Facturation</CardTitle>
            <CardDescription>Répartition par statut</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.invoiceStatus}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={90}
                    paddingAngle={8}
                    dataKey="value"
                  >
                    {stats.invoiceStatus.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} stroke="none" />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4 w-full">
              {stats.invoiceStatus.map((status, i) => (
                <div key={status.name} className="text-center">
                  <p className="text-lg font-black" style={{ color: PIE_COLORS[i] }}>{status.value}</p>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{status.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Popular Acts & Recent Invoices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Acts */}
        <Card className="rounded-[2.5rem] border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <Activity className="size-5 text-primary" />
              Actes Médicaux les plus Sollicités
            </CardTitle>
            <CardDescription>Top 5 des prestations en volume</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.popularActs.map((act, index) => (
                <div key={act.id} className="flex items-center justify-between p-3 rounded-2xl bg-muted/30 group hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                      #{index + 1}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{act.name}</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-tighter">Volume de Prestation</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-primary">{act.usageCount}</p>
                    <p className="text-[10px] text-muted-foreground">actes réalisés</p>
                  </div>
                </div>
              ))}
              {stats.popularActs.length === 0 && (
                <div className="text-center py-10 text-muted-foreground italic">Aucune donnée d'actes enregistrée</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Invoices */}
        <Card className="rounded-[2.5rem] border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-black flex items-center gap-2">
              <History className="size-5 text-primary" />
              Factures Récentes
            </CardTitle>
            <CardDescription>Dernières activités de facturation</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentInvoices.map((invoice) => (
                <div key={invoice.id} className="flex items-center justify-between p-3 rounded-2xl border border-border shadow-sm hover:border-primary/30 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                      <Receipt className="size-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        {invoice.patient.firstName} {invoice.patient.lastName}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        Facture No: {invoice.invoiceNumber} • {new Date(invoice.createdAt).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="text-sm font-black text-foreground">
                      {Number(invoice.totalAmount).toLocaleString()} <span className="text-[10px] font-normal">FBU</span>
                    </p>
                    <Badge className={cn(
                      "text-[9px] uppercase tracking-widest px-2",
                      invoice.status === 'paid' ? "bg-success/10 text-success" : "bg-warning/10 text-warning"
                    )} variant="secondary">
                      {invoice.status}
                    </Badge>
                  </div>
                </div>
              ))}
              <div className="pt-2">
                <Button variant="ghost" className="w-full rounded-xl gap-2 font-bold" asChild>
                  <Link href="/billing">
                    Toutes les factures <ArrowRight className="size-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Navigation Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {[
          { icon: Users, label: "Patients", href: "/patients" },
          { icon: Pill, label: "Pharmacie", href: "/pharmacy/sales" },
          { icon: Receipt, label: "Factures", href: "/billing" },
          { icon: Activity, label: "Actes", href: "/acts" },
          { icon: Package, label: "Stock", href: "/pharmacy/stock" },
          { icon: Settings, label: "Paramètres", href: "/settings" }
        ].map((link) => (
          <Link key={link.href} href={link.href}>
            <div className="flex flex-col items-center gap-2 p-4 rounded-3xl bg-card border border-border hover:border-primary hover:bg-primary/5 transition-all text-center">
              <link.icon className="size-6 text-primary" />
              <span className="text-xs font-bold text-foreground">{link.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ')
}

// Re-importing Lucide icons missed
// Removed redundant re-imports as they are now at the top
