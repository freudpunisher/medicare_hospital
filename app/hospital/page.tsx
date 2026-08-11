"use client"

import { useState, useEffect } from "react"
import { Hospital, BedDouble, DoorOpen, Users, Loader2, ArrowRight, Calendar, ClipboardCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { PageHeader } from "@/components/page-header"
import Link from "next/link"

export default function HospitalDashboard() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/hospital/stats")
      .then(r => r.json())
      .then(d => { if (d.data) setStats(d.data) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="p-6"><Loader2 className="size-8 animate-spin mx-auto text-primary/30" /></div>

  return (
    <div className="p-6 space-y-6 max-w-[1400px] mx-auto">
      <PageHeader title="Hospitalisation" description="Gestion des admissions, services et lits">
        <Link href="/hospital/admissions">
          <Button className="rounded-full h-10 px-6 font-black uppercase text-[10px] tracking-widest shadow-xl shadow-primary/20">
            <ArrowRight className="size-4 mr-2" />Nouvelle Admission
          </Button>
        </Link>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-blue-500/10 to-blue-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-blue-500/20 flex items-center justify-center"><Hospital className="size-5 text-blue-600" /></div>
            <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Hospitalisés</p><p className="text-xl font-black">{stats?.admitted || 0}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-emerald-500/10 to-emerald-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-emerald-500/20 flex items-center justify-center"><Calendar className="size-5 text-emerald-600" /></div>
            <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Aujourd&apos;hui</p><p className="text-xl font-black">{stats?.todayAdmissions || 0}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-amber-500/10 to-amber-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-amber-500/20 flex items-center justify-center"><Users className="size-5 text-amber-600" /></div>
            <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Lits Occupés</p><p className="text-xl font-black">{stats?.occupiedBeds || 0}</p></div>
          </CardContent>
        </Card>
        <Card className="rounded-2xl border-none shadow-sm bg-gradient-to-br from-violet-500/10 to-violet-500/5">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="size-10 rounded-xl bg-violet-500/20 flex items-center justify-center"><BedDouble className="size-5 text-violet-600" /></div>
            <div><p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Lits Disponibles</p><p className="text-xl font-black">{stats?.availableBeds || 0}</p></div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Link href="/hospital/admissions">
          <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-primary/5 to-primary/0">
            <CardContent className="p-6 flex items-center justify-between">
              <div><h3 className="font-black text-sm">Admissions</h3><p className="text-xs text-muted-foreground font-bold mt-1">Voir les patients hospitalisés</p></div>
              <ClipboardCheck className="size-8 text-primary/40" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/hospital/wards">
          <Card className="rounded-2xl border-none shadow-sm hover:shadow-md transition-all cursor-pointer bg-gradient-to-br from-emerald-500/5 to-emerald-500/0">
            <CardContent className="p-6 flex items-center justify-between">
              <div><h3 className="font-black text-sm">Services</h3><p className="text-xs text-muted-foreground font-bold mt-1">Gérer les services d&apos;hospitalisation</p></div>
              <DoorOpen className="size-8 text-emerald-500/40" />
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  )
}
