"use client"

import { useMemo } from "react"
import { TrendingUp, TrendingDown, DollarSign, Users, Receipt, CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/page-header"
import {
  payments,
  expenses,
  invoices,
  patients,
  accountingJournal,
} from "@/lib/mock-data"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from "recharts"

const PIE_COLORS = [
  "oklch(0.55 0.15 240)",
  "oklch(0.65 0.13 180)",
  "oklch(0.75 0.15 80)",
  "oklch(0.60 0.20 25)",
  "oklch(0.58 0.10 300)",
]

export default function FinancialReportsPage() {
  const totalRevenue = useMemo(() => payments.reduce((sum, p) => sum + p.amount, 0), [])
  const totalExpensesAmt = useMemo(() => expenses.reduce((sum, e) => sum + e.amount, 0), [])
  const netProfit = totalRevenue - totalExpensesAmt
  const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : "0"

  const totalInvoiced = useMemo(() => invoices.reduce((sum, i) => sum + i.total_amount, 0), [])
  const totalInsuranceCovered = useMemo(() => invoices.reduce((sum, i) => sum + i.insurance_amount, 0), [])
  const totalPatientPaid = useMemo(() => invoices.reduce((sum, i) => sum + i.patient_amount, 0), [])

  // Payment method breakdown
  const paymentMethodData = useMemo(() => {
    const methods: Record<string, number> = {}
    payments.forEach((p) => {
      const label = p.payment_method
        .replace("_", " ")
        .replace(/\b\w/g, (c) => c.toUpperCase())
      methods[label] = (methods[label] || 0) + p.amount
    })
    return Object.entries(methods).map(([name, value]) => ({ name, value }))
  }, [])

  // Expense category breakdown
  const expenseCategoryData = useMemo(() => {
    const cats: Record<string, number> = {}
    expenses.forEach((e) => {
      cats[e.category] = (cats[e.category] || 0) + e.amount
    })
    return Object.entries(cats).map(([name, value]) => ({ name, value }))
  }, [])

  // Revenue vs expenses trend (mock monthly)
  const trendData = [
    { month: "Jan", revenue: 1200, expenses: 450 },
    { month: "Feb", revenue: 1800, expenses: 620 },
    { month: "Mar", revenue: 2400, expenses: 780 },
    { month: "Apr", revenue: 2100, expenses: 550 },
    { month: "May", revenue: 3100, expenses: 890 },
    { month: "Jun", revenue: 3600, expenses: 720 },
    { month: "Jul", revenue: 2800, expenses: 1295 },
  ]

  // Invoice status summary
  const invoiceStats = useMemo(() => ({
    paid: invoices.filter((i) => i.status === "paid").length,
    partial: invoices.filter((i) => i.status === "partial").length,
    draft: invoices.filter((i) => i.status === "draft").length,
  }), [])

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Financial Reports"
        description="Comprehensive financial analysis and reporting"
      />

      {/* Top KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="size-5 text-success" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Revenue</p>
                <p className="text-xl font-bold text-foreground">
                  ${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-destructive/10">
                <TrendingDown className="size-5 text-destructive" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Total Expenses</p>
                <p className="text-xl font-bold text-foreground">
                  ${totalExpensesAmt.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <DollarSign className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Net Profit</p>
                <p className={`text-xl font-bold ${netProfit >= 0 ? "text-success" : "text-destructive"}`}>
                  ${netProfit.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                <Receipt className="size-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Profit Margin</p>
                <p className="text-xl font-bold text-foreground">{profitMargin}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Revenue vs Expenses Trend */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Revenue vs Expenses Trend</CardTitle>
          <CardDescription>Monthly comparison over the period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" tick={{ fill: "oklch(0.50 0.02 240)", fontSize: 12 }} />
                <YAxis tick={{ fill: "oklch(0.50 0.02 240)", fontSize: 12 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(1 0 0)",
                    border: "1px solid oklch(0.91 0.01 240)",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  formatter={(value: number, name: string) => [
                    `$${value.toLocaleString()}`,
                    name.charAt(0).toUpperCase() + name.slice(1),
                  ]}
                />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="oklch(0.60 0.17 145)"
                  strokeWidth={2}
                  dot={{ fill: "oklch(0.60 0.17 145)", r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="expenses"
                  stroke="oklch(0.577 0.245 27.325)"
                  strokeWidth={2}
                  dot={{ fill: "oklch(0.577 0.245 27.325)", r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Payment Methods */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Revenue by Payment Method</CardTitle>
            <CardDescription>Breakdown of payment channels</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethodData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {paymentMethodData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(1 0 0)",
                      border: "1px solid oklch(0.91 0.01 240)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Amount"]}
                  />
                  <Legend verticalAlign="bottom" iconType="circle" iconSize={8} wrapperStyle={{ fontSize: "12px" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Expense Categories */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Expenses by Category</CardTitle>
            <CardDescription>Where the money goes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={expenseCategoryData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis type="number" tick={{ fill: "oklch(0.50 0.02 240)", fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" width={100} tick={{ fill: "oklch(0.50 0.02 240)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(1 0 0)",
                      border: "1px solid oklch(0.91 0.01 240)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`$${value.toFixed(2)}`, "Amount"]}
                  />
                  <Bar dataKey="value" fill="oklch(0.577 0.245 27.325)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Billing Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Billing Overview</CardTitle>
            <CardDescription>Invoice and coverage breakdown</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Invoiced</span>
                <span className="text-sm font-semibold text-foreground">
                  ${totalInvoiced.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Insurance Covered</span>
                <span className="text-sm font-semibold text-primary">
                  ${totalInsuranceCovered.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Patient Responsibility</span>
                <span className="text-sm font-semibold text-foreground">
                  ${totalPatientPaid.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <Separator />
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Invoice Status</p>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="border-success/30 bg-success/10 text-success text-xs">
                  Paid: {invoiceStats.paid}
                </Badge>
                <Badge variant="outline" className="border-warning/30 bg-warning/10 text-warning text-xs">
                  Partial: {invoiceStats.partial}
                </Badge>
                <Badge variant="outline" className="text-muted-foreground text-xs">
                  Draft: {invoiceStats.draft}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Key Metrics</CardTitle>
            <CardDescription>Hospital performance indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Patients</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{patients.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Invoices</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{invoices.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Total Payments</span>
                </div>
                <span className="text-sm font-semibold text-foreground">{payments.length}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <DollarSign className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Avg Invoice Value</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  ${invoices.length > 0
                    ? (totalInvoiced / invoices.length).toLocaleString("en-US", { minimumFractionDigits: 2 })
                    : "0.00"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="size-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">Insured Rate</span>
                </div>
                <span className="text-sm font-semibold text-foreground">
                  {((patients.filter((p) => p.is_insured).length / patients.length) * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
