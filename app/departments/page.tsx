"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
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
import { departments as initialDepartments, specialties } from "@/lib/mock-data"
import { toast } from "sonner"

type Department = (typeof initialDepartments)[number]

export default function DepartmentsPage() {
  const [data, setData] = useState<Department[]>(initialDepartments)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "", description: "", is_active: true })

  function handleAdd() {
    if (!form.name) return
    setData((prev) => [{ id: `dept-${Date.now()}`, ...form }, ...prev])
    setOpen(false)
    setForm({ name: "", description: "", is_active: true })
    toast.success("Department added successfully")
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Departments" description="Manage hospital departments">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="size-4 mr-1" />Add Department</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Department</DialogTitle>
              <DialogDescription>Enter department details below.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Add Department</Button>
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
                <TableHead>Description</TableHead>
                <TableHead>Specialties</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((dept) => {
                const specCount = specialties.filter((s) => s.department_id === dept.id).length
                return (
                  <TableRow key={dept.id}>
                    <TableCell className="font-medium text-foreground">{dept.name}</TableCell>
                    <TableCell className="text-muted-foreground">{dept.description}</TableCell>
                    <TableCell className="text-muted-foreground">{specCount}</TableCell>
                    <TableCell><StatusBadge active={dept.is_active} /></TableCell>
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
