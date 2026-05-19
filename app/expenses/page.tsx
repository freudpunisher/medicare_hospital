"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
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
import { expenses as initialExpenses, cashSessions } from "@/lib/mock-data"
import { toast } from "sonner"

type Expense = (typeof initialExpenses)[number]

const categories = ["Supplies", "Maintenance", "Services", "Medical", "Utilities", "Other"]

export default function ExpensesPage() {
  const [data, setData] = useState<Expense[]>(initialExpenses)
  const [open, setOpen] = useState(false)
  const [filterCategory, setFilterCategory] = useState<string>("all")
  const [form, setForm] = useState({
    description: "",
    amount: 0,
    category: "Supplies",
    expense_date: new Date().toISOString().split("T")[0],
    recorded_by: "",
    cash_session_id: "",
  })

  const openSessions = cashSessions.filter((s) => s.status === "open")
  const filtered =
    filterCategory === "all"
      ? data
      : data.filter((e) => e.category === filterCategory)

  const totalExpenses = filtered.reduce((sum, e) => sum + e.amount, 0)

  function handleAdd() {
    if (!form.description || !form.amount || !form.cash_session_id) return
    const expense: Expense = {
      id: `exp-${Date.now()}`,
      ...form,
    }
    setData((prev) => [expense, ...prev])
    setOpen(false)
    setForm({ description: "", amount: 0, category: "Supplies", expense_date: new Date().toISOString().split("T")[0], recorded_by: "", cash_session_id: "" })
    toast.success("Expense recorded")
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Expenses" description="Track operational expenses">
        <div className="flex items-center gap-2">
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className="w-[150px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="size-4 mr-1" />Record Expense</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Expense</DialogTitle>
                <DialogDescription>Enter expense details.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Amount ($)</Label>
                    <Input type="number" min={0} step={0.01} value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Category</Label>
                    <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {categories.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Date</Label>
                    <Input type="date" value={form.expense_date} onChange={(e) => setForm((f) => ({ ...f, expense_date: e.target.value }))} />
                  </div>
                  <div className="space-y-2">
                    <Label>Recorded By</Label>
                    <Input value={form.recorded_by} onChange={(e) => setForm((f) => ({ ...f, recorded_by: e.target.value }))} />
                  </div>
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
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd}>Record Expense</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </PageHeader>

      {/* Total Card */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Total Expenses (filtered)</span>
            <span className="text-lg font-bold text-foreground">
              ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Recorded By</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell className="font-medium text-foreground">{expense.description}</TableCell>
                  <TableCell className="font-semibold text-destructive">
                    -${expense.amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="text-xs">{expense.category}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">{expense.expense_date}</TableCell>
                  <TableCell className="text-muted-foreground">{expense.recorded_by}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
