"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
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
import { cashRegisters as initialRegisters, cashSessions } from "@/lib/mock-data"
import { toast } from "sonner"

type CashRegister = (typeof initialRegisters)[number]

export default function CashRegisterPage() {
  const [data, setData] = useState<CashRegister[]>(initialRegisters)
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({ name: "" })

  function handleAdd() {
    if (!form.name) return
    setData((prev) => [
      { id: `cr-${Date.now()}`, name: form.name, is_active: true, created_at: new Date().toISOString() },
      ...prev,
    ])
    setOpen(false)
    setForm({ name: "" })
    toast.success("Cash register added successfully")
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Cash Registers" description="Manage physical cash registers">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="size-4 mr-1" />Add Register</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Cash Register</DialogTitle>
              <DialogDescription>Enter the register name.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={form.name} onChange={(e) => setForm({ name: e.target.value })} placeholder="e.g. Main Reception" />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={handleAdd}>Add Register</Button>
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
                <TableHead>Open Sessions</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((reg) => {
                const openSessions = cashSessions.filter(
                  (s) => s.cash_register_id === reg.id && s.status === "open"
                ).length
                return (
                  <TableRow key={reg.id}>
                    <TableCell className="font-medium text-foreground">{reg.name}</TableCell>
                    <TableCell className="text-muted-foreground">{openSessions}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(reg.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell><StatusBadge active={reg.is_active} /></TableCell>
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
