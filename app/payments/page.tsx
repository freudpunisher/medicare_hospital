"use client"

import { useState } from "react"
import { Plus, CreditCard, Banknote, Smartphone, Building } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
import { payments as initialPayments, cashSessions } from "@/lib/mock-data"
import { toast } from "sonner"

type Payment = (typeof initialPayments)[number]

const methodIcons = {
  cash: Banknote,
  card: CreditCard,
  mobile_money: Smartphone,
  bank_transfer: Building,
}

const methodLabels = {
  cash: "Cash",
  card: "Card",
  mobile_money: "Mobile Money",
  bank_transfer: "Bank Transfer",
}

export default function PaymentsPage() {
  const [data, setData] = useState<Payment[]>(initialPayments)
  const [open, setOpen] = useState(false)
  const [filterMethod, setFilterMethod] = useState<string>("all")
  const [form, setForm] = useState({
    invoice_id: "",
    patient_name: "",
    amount: 0,
    payment_method: "cash" as Payment["payment_method"],
    received_by: "",
    cash_session_id: "",
  })

  const openSessions = cashSessions.filter((s) => s.status === "open")
  const filtered =
    filterMethod === "all"
      ? data
      : data.filter((p) => p.payment_method === filterMethod)

  function handleAdd() {
    if (!form.patient_name || !form.amount || !form.cash_session_id) return
    const payment: Payment = {
      id: `pay-${Date.now()}`,
      ...form,
      paid_at: new Date().toISOString(),
    }
    setData((prev) => [payment, ...prev])
    setOpen(false)
    setForm({ invoice_id: "", patient_name: "", amount: 0, payment_method: "cash", received_by: "", cash_session_id: "" })
    toast.success("Payment recorded")
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Payments" description="Track all received payments">
        <div className="flex items-center gap-2">
          <Select value={filterMethod} onValueChange={setFilterMethod}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Methods</SelectItem>
              <SelectItem value="cash">Cash</SelectItem>
              <SelectItem value="card">Card</SelectItem>
              <SelectItem value="mobile_money">Mobile Money</SelectItem>
              <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="size-4 mr-1" />Record Payment</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
                <DialogDescription>Enter payment details.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Patient Name</Label>
                    <Input value={form.patient_name} onChange={(e) => setForm((f) => ({ ...f, patient_name: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Invoice ID</Label>
                    <Input value={form.invoice_id} onChange={(e) => setForm((f) => ({ ...f, invoice_id: e.target.value }))} placeholder="Optional" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount ($)</Label>
                    <Input type="number" min={0} step={0.01} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Method</Label>
                    <Select value={form.payment_method} onValueChange={(v) => setForm((f) => ({ ...f, payment_method: v as Payment["payment_method"] }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="card">Card</SelectItem>
                        <SelectItem value="mobile_money">Mobile Money</SelectItem>
                        <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Received By</Label>
                    <Input value={form.received_by} onChange={(e) => setForm((f) => ({ ...f, received_by: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Cash Session</Label>
                    <Select value={form.cash_session_id} onValueChange={(v) => setForm((f) => ({ ...f, cash_session_id: v }))}>
                      <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                      <SelectContent>
                        {openSessions.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.opened_by} - {s.id}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd}>Record Payment</Button>
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
                <TableHead>Patient</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Method</TableHead>
                <TableHead>Received By</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((payment) => {
                const Icon = methodIcons[payment.payment_method]
                return (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium text-foreground">{payment.patient_name}</TableCell>
                    <TableCell className="font-semibold text-foreground">
                      ${payment.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">
                        <Icon className="size-3 mr-1" />
                        {methodLabels[payment.payment_method]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{payment.received_by}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(payment.paid_at).toLocaleString()}
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
