"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, ArrowLeft, Save } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"

export default function EditPartnerPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [form, setForm] = useState({
    companyName: "",
    registrationNumber: "",
    taxId: "",
    contactPerson: "",
    contactEmail: "",
    contactPhone: "",
    address: "",
    website: "",
    partnershipStartDate: "",
    partnershipEndDate: "",
    autoRenew: false,
    notes: "",
  })

  useEffect(() => {
    fetchPartner()
  }, [])

  async function fetchPartner() {
    try {
      const res = await fetch(`/api/partners/${id}`)
      const result = await res.json()
      if (res.ok && result.success) {
        const p = result.data
        setForm({
          companyName: p.companyName || "",
          registrationNumber: p.registrationNumber || "",
          taxId: p.taxId || "",
          contactPerson: p.contactPerson || "",
          contactEmail: p.contactEmail || "",
          contactPhone: p.contactPhone || "",
          address: p.address || "",
          website: p.website || "",
          partnershipStartDate: p.partnershipStartDate ? p.partnershipStartDate.slice(0, 10) : "",
          partnershipEndDate: p.partnershipEndDate ? p.partnershipEndDate.slice(0, 10) : "",
          autoRenew: p.autoRenew || false,
          notes: p.notes || "",
        })
      } else {
        toast.error(result.error || "Erreur lors du chargement")
      }
    } catch (err) {
      toast.error("Impossible de se connecter au serveur")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit() {
    if (!form.companyName || !form.partnershipStartDate) return
    setSubmitting(true)
    try {
      const res = await fetch(`/api/partners/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          partnershipEndDate: form.partnershipEndDate || null,
        }),
      })
      const result = await res.json()
      if (res.ok && result.success) {
        toast.success("Partenaire modifié avec succès")
        router.push(`/partners/${id}`)
      } else {
        toast.error(result.error || "Erreur lors de la modification")
      }
    } catch (err) {
      toast.error("Erreur de connexion")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-7xl mx-auto">
        <div className="p-20 text-center flex flex-col items-center gap-4">
          <Loader2 className="size-10 animate-spin text-primary opacity-50" />
          <p className="text-muted-foreground font-bold text-sm animate-pulse">Chargement du partenaire...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <PageHeader title={`Modifier ${form.companyName}`} description="Mettez à jour les informations du partenaire">
        <Button variant="ghost" size="sm" className="rounded-full font-bold" asChild>
          <Link href={`/partners/${id}`}>
            <ArrowLeft className="size-4 mr-2" />
            Annuler
          </Link>
        </Button>
      </PageHeader>

      <Card className="rounded-[2.5rem] border-none shadow-sm bg-card/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-lg font-black">Informations du Partenaire</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 max-w-2xl">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Nom de l'entreprise</Label>
              <Input
                placeholder="ex: Société Générale..."
                className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Numéro d'enregistrement</Label>
                <Input
                  placeholder="RC ou NINEA"
                  className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                  value={form.registrationNumber}
                  onChange={(e) => setForm((f) => ({ ...f, registrationNumber: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">N° Fiscal (Tax ID)</Label>
                <Input
                  placeholder="ex: 123456789"
                  className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                  value={form.taxId}
                  onChange={(e) => setForm((f) => ({ ...f, taxId: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Personne de contact</Label>
                <Input
                  placeholder="Nom complet"
                  className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                  value={form.contactPerson}
                  onChange={(e) => setForm((f) => ({ ...f, contactPerson: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Email de contact</Label>
                <Input
                  placeholder="contact@entreprise.com"
                  className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                  value={form.contactEmail}
                  onChange={(e) => setForm((f) => ({ ...f, contactEmail: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Téléphone</Label>
                <Input
                  placeholder="+221 33 000 00 00"
                  className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                  value={form.contactPhone}
                  onChange={(e) => setForm((f) => ({ ...f, contactPhone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Site web</Label>
                <Input
                  placeholder="https://entreprise.com"
                  className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                  value={form.website}
                  onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Adresse</Label>
              <Textarea
                placeholder="Adresse complète de l'entreprise..."
                className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20 min-h-[60px]"
                value={form.address}
                onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Date de début de partenariat</Label>
                <Input
                  type="date"
                  className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                  value={form.partnershipStartDate}
                  onChange={(e) => setForm((f) => ({ ...f, partnershipStartDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Date de fin (optionnelle)</Label>
                <Input
                  type="date"
                  className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20"
                  value={form.partnershipEndDate}
                  onChange={(e) => setForm((f) => ({ ...f, partnershipEndDate: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center space-x-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
              <Switch
                id="autoRenew"
                checked={form.autoRenew}
                onCheckedChange={(c) => setForm((f) => ({ ...f, autoRenew: c }))}
              />
              <Label htmlFor="autoRenew" className="font-bold cursor-pointer">Renouvellement automatique</Label>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase tracking-wider text-muted-foreground ml-1">Notes (optionnel)</Label>
              <Textarea
                placeholder="Informations complémentaires..."
                className="rounded-2xl border-muted/50 bg-muted/20 focus:ring-primary/20 min-h-[80px]"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="ghost" className="rounded-full font-bold" asChild>
                <Link href={`/partners/${id}`}>Annuler</Link>
              </Button>
              <Button onClick={handleSubmit} disabled={submitting || !form.companyName || !form.partnershipStartDate} className="rounded-full font-black px-8 shadow-lg">
                {submitting ? <Loader2 className="size-4 animate-spin mr-2" /> : <Save className="size-4 mr-2" />}
                Enregistrer les Modifications
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
