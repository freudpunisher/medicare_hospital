"use client"

import { useState } from "react"
import { Plus, Clock, CheckCircle2 } from "lucide-react"
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
import { cashSessions as initialSessions, cashRegisters, payments, expenses } from "@/lib/mock-data"
import { toast } from "sonner"

type CashSession = (typeof initialSessions)[number]

export default function CashSessionsPage() {
  const [data, setData] = useState<CashSession[]>(initialSessions)
  const [open, setOpen] = useState(false)
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [form, setForm] = useState({
    cash_register_id: "",
    opened_by: "",
    opening_balance: 0,
  })

  const filtered =
    filterStatus === "all" ? data : data.filter((s) => s.status === filterStatus)

  function handleAdd() {
    if (!form.cash_register_id || !form.opened_by) return
    const session: CashSession = {
      id: `cs-${Date.now()}`,
      cash_register_id: form.cash_register_id,
      opened_by: form.opened_by,
      opened_at: new Date().toISOString(),
      closed_at: null,
      opening_balance: form.opening_balance,
      closing_balance: null,
      status: "open",
    }
    setData((prev) => [session, ...prev])
    setOpen(false)
    setForm({ cash_register_id: "", opened_by: "", opening_balance: 0 })
    toast.success("Cash session opened")
  }

  function closeSession(sessionId: string) {
    setData((prev) =>
      prev.map((s) => {
        if (s.id !== sessionId) return s
        const sessionPayments = payments
          .filter((p) => p.cash_session_id === s.id)
          .reduce((sum, p) => sum + p.amount, 0)
        const sessionExpenses = expenses
          .filter((e) => e.cash_session_id === s.id)
          .reduce((sum, e) => sum + e.amount, 0)
        return {
          ...s,
          status: "closed" as const,
          closed_at: new Date().toISOString(),
          closing_balance: s.opening_balance + sessionPayments - sessionExpenses,
        }
      })
    )
    toast.success("Cash session closed")
  }

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Cash Sessions" description="Manage daily cash sessions">
        <div className="flex items-center gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[130px] h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="open">Open</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="size-4 mr-1" />Open Session</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Open Cash Session</DialogTitle>
                <DialogDescription>Start a new cash session for a register.</DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Cash Register</Label>
                  <Select value={form.cash_register_id} onValueChange={(v) => setForm((f) => ({ ...f, cash_register_id: v }))}>
                    <SelectTrigger><SelectValue placeholder="Select register" /></SelectTrigger>
                    <SelectContent>
                      {cashRegisters.filter(r => r.is_active).map((r) => (
                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Opened By</Label>
                  <Input value={form.opened_by} onChange={(e) => setForm((f) => ({ ...f, opened_by: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Opening Balance ($)</Label>
                  <Input type="number" min={0} step={0.01} value={form.opening_balance} onChange={(e) => setForm((f) => ({ ...f, opening_balance: parseFloat(e.target.value) || 0 }))} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={handleAdd}>Open Session</Button>
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
                <TableHead>Register</TableHead>
                <TableHead>Opened By</TableHead>
                <TableHead>Opened At</TableHead>
                <TableHead>Closed At</TableHead>
                <TableHead>Opening</TableHead>
                <TableHead>Closing</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((session) => {
                const register = cashRegisters.find((r) => r.id === session.cash_register_id)
                return (
                  <TableRow key={session.id}>
                    <TableCell className="font-medium text-foreground">{register?.name ?? "N/A"}</TableCell>
                    <TableCell className="text-muted-foreground">{session.opened_by}</TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {new Date(session.opened_at).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs">
                      {session.closed_at ? new Date(session.closed_at).toLocaleString() : "-"}
                    </TableCell>
                    <TableCell className="text-foreground">
                      ${session.opening_balance.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-foreground">
                      {session.closing_balance != null ? `$${session.closing_balance.toFixed(2)}` : "-"}
                    </TableCell>
                    <TableCell>
                      {session.status === "open" ? (
                        <Badge variant="outline" className="border-success/30 bg-success/10 text-success text-xs">
                          <Clock className="size-3 mr-1" />
                          Open
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground text-xs">
                          <CheckCircle2 className="size-3 mr-1" />
                          Closed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {session.status === "open" && (
                        <Button size="sm" variant="outline" onClick={() => closeSession(session.id)}>
                          Close
                        </Button>
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
