"use client"

import { useState } from "react"
import { Plus, ShieldAlert } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { insuranceServiceRules as initialRules, insurances, services } from "@/lib/mock-data"
import { toast } from "sonner"

type Rule = (typeof initialRules)[number]

export default function InsuranceRulesPage() {
  const [data, setData] = useState<Rule[]>(initialRules)
  const [open, setOpen] = useState(false)
  const [filterInsurance, setFilterInsurance] = useState<string>("all")
  const [form, setForm] = useState({
    insurance_id: "",
    service_id: "",
    coverage_rate: 80,
    plafond: null as number | null,
    requires_authorization: false,
  })

  const filtered = filterInsurance === "all"
    ? data
    : data.filter((r) => r.insurance_id === filterInsurance)

  function handleAdd() {
    if (!form.insurance_id || !form.service_id) return
    setData((prev) => [{ id: `isr-${Date.now()}`, ...form }, ...prev])
    setOpen(false)
    setForm({ insurance_id: "", service_id: "", coverage_rate: 80, plafond: null, requires_authorization: false })
    toast.success("Insurance rule added successfully")
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Insurance Rules" description="Manage coverage rules per insurance and service">
        <div className="flex items-center gap-2">
          <Select value={filterInsurance} onValueChange={setFilterInsurance}>
            <SelectTrigger className="w-[200px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Insurances</SelectItem>
              {insurances.map((ins) => (
                <SelectItem key={ins.id} value={ins.id}>{ins.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="size-4 mr-1" />Add Rule</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Insurance Rule</DialogTitle>
                <DialogDescription>Define coverage for a service under an insurance.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Insurance</Label>
                    <Select value={form.insurance_id} onValueChange={(v) => setForm((f) => ({ ...f, insurance_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select insurance" /></SelectTrigger>
                      <SelectContent>
                        {insurances.filter(i => i.is_active).map((i) => (
                          <SelectItem key={i.id} value={i.id}>{i.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Service</Label>
                    <Select value={form.service_id} onValueChange={(v) => setForm((f) => ({ ...f, service_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger>
                      <SelectContent>
                        {services.filter(s => s.is_active).map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Coverage Rate (%)</Label>
                    <Input type="number" min={0} max={100} value={form.coverage_rate} onChange={(e) => setForm((f) => ({ ...f, coverage_rate: parseInt(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Plafond ($) (optional)</Label>
                    <Input type="number" min={0} step={0.01} value={form.plafond ?? ""} onChange={(e) => setForm((f) => ({ ...f, plafond: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="No limit" />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={form.requires_authorization} onCheckedChange={(c) => setForm((f) => ({ ...f, requires_authorization: c }))} />
                  <Label>Requires authorization</Label>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd}>Add Rule</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Insurance</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Coverage</TableHead>
                <TableHead>Plafond</TableHead>
                <TableHead>Authorization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((rule) => {
                const ins = insurances.find((i) => i.id === rule.insurance_id)
                const svc = services.find((s) => s.id === rule.service_id)
                return (
                  <TableRow key={rule.id}>
                    <TableCell className="font-medium text-foreground">{ins?.name ?? "N/A"}</TableCell>
                    <TableCell className="text-muted-foreground">{svc?.name ?? "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">{rule.coverage_rate}%</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {rule.plafond != null
                        ? `$${rule.plafond.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                        : "No limit"}
                    </TableCell>
                    <TableCell>
                      {rule.requires_authorization ? (
                        <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning text-xs">
                          <ShieldAlert className="size-3 mr-1" />
                          Required
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">No</span>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
