"use client"

import { useState } from "react"
import { Plus, Phone } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { doctors as initialDoctors, specialties, departments } from "@/lib/mock-data"
import { toast } from "sonner"

type Doctor = (typeof initialDoctors)[number]

export default function DoctorsPage() {
  const [doctorsData, setDoctorsData] = useState<Doctor[]>(initialDoctors)
  const [open, setOpen] = useState(false)
  const [newDoctor, setNewDoctor] = useState({
    first_name: "",
    last_name: "",
    specialty_id: "",
    phone: "",
    is_active: true,
  })

  function handleAdd() {
    if (!newDoctor.first_name || !newDoctor.last_name || !newDoctor.specialty_id) return
    const doctor: Doctor = {
      id: `doc-${Date.now()}`,
      ...newDoctor,
    }
    setDoctorsData((prev) => [doctor, ...prev])
    setOpen(false)
    setNewDoctor({ first_name: "", last_name: "", specialty_id: "", phone: "", is_active: true })
    toast.success("Doctor added successfully")
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Doctors" description="Manage medical staff">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="size-4 mr-1" />
              Add Doctor
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Doctor</DialogTitle>
              <DialogDescription>Enter doctor information below.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={newDoctor.first_name}
                    onChange={(e) => setNewDoctor((d) => ({ ...d, first_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={newDoctor.last_name}
                    onChange={(e) => setNewDoctor((d) => ({ ...d, last_name: e.target.value }))}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Specialty</Label>
                <Select
                  value={newDoctor.specialty_id}
                  onValueChange={(v) => setNewDoctor((d) => ({ ...d, specialty_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select specialty" />
                  </SelectTrigger>
                  <SelectContent>
                    {specialties.filter(s => s.is_active).map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={newDoctor.phone}
                  onChange={(e) => setNewDoctor((d) => ({ ...d, phone: e.target.value }))}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Add Doctor</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </PageHeader>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Doctor</TableHead>
                <TableHead>Specialty</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doctorsData.map((doctor) => {
                const specialty = specialties.find((s) => s.id === doctor.specialty_id)
                const department = departments.find((d) => d.id === specialty?.department_id)
                return (
                  <TableRow key={doctor.id}>
                    <TableCell>
                      <div className="font-medium text-foreground">
                        Dr. {doctor.first_name} {doctor.last_name}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {specialty?.name ?? "N/A"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {department?.name ?? "N/A"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <Phone className="size-3.5" />
                        {doctor.phone}
                      </div>
                    </TableCell>
                    <TableCell>
                      <StatusBadge active={doctor.is_active} />
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
