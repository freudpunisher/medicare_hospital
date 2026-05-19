"use client"

import Link from 'next/link'
import { Users, UserCog, Activity, Layers, Receipt, TrendingUp, TrendingDown, DollarSign } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { PageHeader } from "@/components/page-header"
import { patients, doctors, acts, services, invoices, payments, expenses } from "@/lib/mock-data"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts"

const kpis = [
  {
    title: "Total Patients",
    value: patients.length,
    icon: Users,
    change: "+12%",
    trend: "up" as const,
  },
  {
    title: "Active Doctors",
    value: doctors.filter((d) => d.is_active).length,
    icon: UserCog,
    change: "+2",
    trend: "up" as const,
  },
  {
    title: "Active Acts",
    value: acts.filter((a) => a.is_active).length,
    icon: Activity,
    change: "+5",
    trend: "up" as const,
  },
  {
    title: "Active Services",
    value: services.filter((s) => s.is_active).length,
    icon: Layers,
    change: "0",
    trend: "neutral" as const,
  },
  {
    title: "Total Invoices",
    value: invoices.length,
    icon: Receipt,
    change: "+18%",
    trend: "up" as const,
  },
]

const totalIncome = payments.reduce((sum, p) => sum + p.amount, 0)
const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
const netResult = totalIncome - totalExpenses

const monthlyRevenue = [
  { month: "Jan", revenue: 2400 },
  { month: "Feb", revenue: 1800 },
  { month: "Mar", revenue: 3200 },
  { month: "Apr", revenue: 2800 },
  { month: "May", revenue: 3600 },
  { month: "Jun", revenue: 4100 },
  { month: "Jul", revenue: 3800 },
]

const invoiceStatusData = [
  { name: "Paid", value: invoices.filter((i) => i.status === "paid").length },
  { name: "Partial", value: invoices.filter((i) => i.status === "partial").length },
  { name: "Draft", value: invoices.filter((i) => i.status === "draft").length },
]

const PIE_COLORS = [
  "oklch(0.60 0.17 145)",
  "oklch(0.75 0.15 80)",
  "oklch(0.50 0.02 240)",
]

export default function DashboardPage() {
  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="Dashboard"
        description="Overview of your hospital management system"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardContent className="p-5">
              <div className="flex items-center justify-between">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10">
                  <kpi.icon className="size-5 text-primary" />
                </div>
                <span  className={`flex items-center gap-1 text-xs font-medium ${ kpi.trend === "up" ? "text-success"  : kpi.trend === "neutral" ? "text-destructive"         : "text-muted-foreground"  }`}    >         
               
                  {kpi.trend === "up" && <TrendingUp className="size-3" />}
                  {kpi.trend === "neutral" && <TrendingDown className="size-3" />}
                  {kpi.change}
                </span>
              </div>
              <div className="mt-3">
                <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{kpi.title}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="size-5 text-success" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Income</p>
                <p className="text-xl font-bold text-foreground">
                  ${totalIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
                <p className="text-sm text-muted-foreground">Total Expenses</p>
                <p className="text-xl font-bold text-foreground">
                  ${totalExpenses.toLocaleString("en-US", { minimumFractionDigits: 2 })}
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
                <p className="text-sm text-muted-foreground">Net Result</p>
                <p className="text-xl font-bold text-foreground">
                  ${netResult.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Monthly Revenue</CardTitle>
            <CardDescription>Revenue trend over the past months</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" tick={{ fill: "oklch(0.50 0.02 240)" }} />
                  <YAxis className="text-xs" tick={{ fill: "oklch(0.50 0.02 240)" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "oklch(1 0 0)",
                      border: "1px solid oklch(0.91 0.01 240)",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, "Revenue"]}
                  />
                  <Bar dataKey="revenue" fill="oklch(0.55 0.15 240)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Invoice Status</CardTitle>
            <CardDescription>Distribution by status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={invoiceStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {invoiceStatusData.map((_, index) => (
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
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ fontSize: "12px" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Invoices */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent Invoices</CardTitle>
          <CardDescription>Latest billing activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {invoices.slice(0, 5).map((invoice) => {
              const patient = patients.find((p) => p.id === invoice.patient_id)
              return (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                      <Receipt className="size-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {patient ? `${patient.first_name} ${patient.last_name}` : "Unknown"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                        invoice.status === "paid"
                          ? "bg-success/10 text-success"
                          : invoice.status === "partial"
                          ? "bg-warning/10 text-warning"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                    <span className="text-sm font-semibold text-foreground">
                      ${invoice.total_amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link className="card" href="/patients">Patients</Link>
        <Link className="card" href="/doctors">Doctors</Link>
        <Link className="card" href="/services">Services</Link>
        <Link className="card" href="/insurances">Insurances</Link>
        <Link className="card" href="/insurances/claims">Insurance Claims</Link>
        <Link className="card" href="/insurances/payments">Insurance Payments</Link>
        <Link className="card" href="/invoices">Invoices</Link>
        <Link className="card" href="/expenses">Expenses</Link>
        <Link className="card" href="/cash">Cash</Link>
        <Link className="card" href="/settings">Settings</Link>
      </div>
    </div>
  )
}
