"use client"

import { useState, useMemo } from "react"
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { PageHeader } from "@/components/page-header"
import { accountingJournal } from "@/lib/mock-data"

export default function AccountingJournalPage() {
  const [filterType, setFilterType] = useState<string>("all")

  const filtered =
    filterType === "all"
      ? accountingJournal
      : accountingJournal.filter((e) => e.type === filterType)

  const summary = useMemo(() => {
    const totalDebit = filtered.reduce((sum, e) => sum + e.debit, 0)
    const totalCredit = filtered.reduce((sum, e) => sum + e.credit, 0)
    return { totalDebit, totalCredit, net: totalDebit - totalCredit }
  }, [filtered])

  return (
    <div className="p-6 space-y-6">
      <PageHeader title="Accounting Journal" description="General ledger of all financial transactions">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[140px] h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entries</SelectItem>
            <SelectItem value="income">Income</SelectItem>
            <SelectItem value="expense">Expense</SelectItem>
          </SelectContent>
        </Select>
      </PageHeader>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="size-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Income (Debit)</p>
                <p className="text-xl font-bold text-foreground">
                  ${summary.totalDebit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
                <TrendingDown className="size-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Expenses (Credit)</p>
                <p className="text-xl font-bold text-foreground">
                  ${summary.totalCredit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Net Result</p>
                <p className={`text-xl font-bold ${summary.net >= 0 ? "text-success" : "text-destructive"}`}>
                  ${summary.net.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Reference</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Debit</TableHead>
                <TableHead className="text-right">Credit</TableHead>
                <TableHead>Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    <Badge variant="secondary" className="font-mono text-xs">{entry.reference}</Badge>
                  </TableCell>
                  <TableCell>
                    {entry.type === "income" ? (
                      <Badge variant="outline" className="border-success/30 bg-success/10 text-success text-xs">
                        <ArrowUpCircle className="size-3 mr-1" />
                        Income
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="border-destructive/30 bg-destructive/10 text-destructive text-xs">
                        <ArrowDownCircle className="size-3 mr-1" />
                        Expense
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-foreground">{entry.description}</TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {entry.debit > 0 ? `$${entry.debit.toFixed(2)}` : "-"}
                  </TableCell>
                  <TableCell className="text-right font-medium text-foreground">
                    {entry.credit > 0 ? `$${entry.credit.toFixed(2)}` : "-"}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-xs">
                    {new Date(entry.created_at).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
