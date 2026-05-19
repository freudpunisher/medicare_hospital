"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
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
import { StatusBadge } from "@/components/status-badge"
import { services as initialServices, acts } from "@/lib/mock-data"
import { toast } from "sonner"

type Service = (typeof initialServices)[number]

export default function ServicesPage() {
  const [data, setData] = useState<Service[]>(initialServices)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", code: "", is_billable: true, is_active: true })

  function handleAdd() {
    if (!form.name || !form.code) return
    setData((prev) => [{ id: `svc-${Date.now()}`, ...form }, ...prev])
    setOpen(false)
    setForm({ name: "", code: "", is_billable: true, is_active: true })
    toast.success("Service added successfully")
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Services" description="Manage hospital services">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="size-4 mr-1" />Add Service</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Service</DialogTitle>
              <DialogDescription>Enter service details below.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Code</Label>
                  <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_billable} onCheckedChange={(c) => setForm((f) => ({ ...f, is_billable: c }))} />
                <Label>Billable service</Label>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Add Service</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Acts</TableHead>
                <TableHead>Billable</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((svc) => {
                const actCount = acts.filter((a) => a.service_id === svc.id).length
                return (
                  <TableRow key={svc.id}>
                    <TableCell className="font-medium text-foreground">{svc.name}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="font-mono text-xs">{svc.code}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{actCount}</TableCell>
                    <TableCell>
                      {svc.is_billable ? (
                        <Badge variant="outline" className="border-success/30 bg-success/10 text-success text-xs">Billable</Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-xs">Non-billable</Badge>
                      )}
                    </TableCell>
                    <TableCell><StatusBadge active={svc.is_active} /></TableCell>
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
