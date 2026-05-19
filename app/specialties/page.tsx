"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { StatusBadge } from "@/components/status-badge"
import { specialties as initialSpecialties, departments } from "@/lib/mock-data"
import { toast } from "sonner"

type Specialty = (typeof initialSpecialties)[number]

export default function SpecialtiesPage() {
  const [data, setData] = useState<Specialty[]>(initialSpecialties)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", department_id: "", description: "", is_active: true })

  function handleAdd() {
    if (!form.name || !form.department_id) return
    setData((prev) => [{ id: `spec-${Date.now()}`, ...form }, ...prev])
    setOpen(false)
    setForm({ name: "", department_id: "", description: "", is_active: true })
    toast.success("Specialty added successfully")
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Specialties" description="Manage medical specialties">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="size-4 mr-1" />Add Specialty</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Specialty</DialogTitle>
              <DialogDescription>Enter specialty details below.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Department</Label>
                <Select value={form.department_id} onValueChange={(v) => setForm((f) => ({ ...f, department_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                  <SelectContent>
                    {departments.filter(d => d.is_active).map((d) => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Add Specialty</Button>
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
                <TableHead>Department</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((spec) => {
                const dept = departments.find((d) => d.id === spec.department_id)
                return (
                  <TableRow key={spec.id}>
                    <TableCell className="font-medium text-foreground">{spec.name}</TableCell>
                    <TableCell className="text-muted-foreground">{dept?.name ?? "N/A"}</TableCell>
                    <TableCell className="text-muted-foreground">{spec.description}</TableCell>
                    <TableCell><StatusBadge active={spec.is_active} /></TableCell>
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
