import { NextResponse } from "next/server"
import { db } from "@/db"
import { journalEntryLines, journalEntries, chartAccounts } from "@/db/schema"
import { sql, eq, and, gte, lte, asc } from "drizzle-orm"

function dateRange(searchParams: URLSearchParams) {
  const conditions = []
  const from = searchParams.get("from")
  const to = searchParams.get("to")
  if (from) conditions.push(gte(journalEntries.entryDate, new Date(from)))
  if (to) {
    const end = new Date(to)
    end.setHours(23, 59, 59, 999)
    conditions.push(lte(journalEntries.entryDate, end))
  }
  conditions.push(eq(journalEntries.status, "posted"))
  return conditions
}

async function trialBalance(searchParams: URLSearchParams) {
  const conditions = dateRange(searchParams)

  const rows = await db.select({
    accountId: journalEntryLines.accountId,
    code: chartAccounts.code,
    label: chartAccounts.label,
    class: chartAccounts.class,
    type: chartAccounts.type,
    totalDebit: sql<string>`sum(${journalEntryLines.debit})`,
    totalCredit: sql<string>`sum(${journalEntryLines.credit})`,
  })
    .from(journalEntryLines)
    .innerJoin(chartAccounts, eq(journalEntryLines.accountId, chartAccounts.id))
    .innerJoin(journalEntries, eq(journalEntryLines.entryId, journalEntries.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(journalEntryLines.accountId, chartAccounts.code, chartAccounts.label, chartAccounts.class, chartAccounts.type)
    .orderBy(asc(chartAccounts.code))

  let totalDebit = 0
  let totalCredit = 0
  const data = rows.map((r) => {
    const debit = parseFloat(r.totalDebit || "0")
    const credit = parseFloat(r.totalCredit || "0")
    totalDebit += debit
    totalCredit += credit
    return {
      ...r,
      totalDebit: debit,
      totalCredit: credit,
      balance: debit - credit,
    }
  })

  return { data, totals: { totalDebit, totalCredit } }
}

async function generalLedger(searchParams: URLSearchParams) {
  const accountId = searchParams.get("accountId")
  const conditions = dateRange(searchParams)
  if (accountId) conditions.push(eq(journalEntryLines.accountId, accountId))

  const rows = await db.select({
    lineId: journalEntryLines.id,
    entryId: journalEntries.id,
    entryNumber: journalEntries.entryNumber,
    entryDate: journalEntries.entryDate,
    label: journalEntries.label,
    referenceType: journalEntries.referenceType,
    libelle: journalEntryLines.libelle,
    debit: journalEntryLines.debit,
    credit: journalEntryLines.credit,
    accountId: journalEntryLines.accountId,
    code: chartAccounts.code,
    accountLabel: chartAccounts.label,
  })
    .from(journalEntryLines)
    .innerJoin(journalEntries, eq(journalEntryLines.entryId, journalEntries.id))
    .innerJoin(chartAccounts, eq(journalEntryLines.accountId, chartAccounts.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(asc(journalEntries.entryDate), asc(journalEntries.entryNumber))

  return { data: rows.map((r) => ({ ...r, debit: parseFloat(r.debit || "0"), credit: parseFloat(r.credit || "0") })) }
}

async function incomeStatement(searchParams: URLSearchParams) {
  const conditions = dateRange(searchParams)
  conditions.push(sql`${chartAccounts.class} in ('6', '7')`)

  const rows = await db.select({
    code: chartAccounts.code,
    label: chartAccounts.label,
    class: chartAccounts.class,
    totalDebit: sql<string>`sum(${journalEntryLines.debit})`,
    totalCredit: sql<string>`sum(${journalEntryLines.credit})`,
  })
    .from(journalEntryLines)
    .innerJoin(chartAccounts, eq(journalEntryLines.accountId, chartAccounts.id))
    .innerJoin(journalEntries, eq(journalEntryLines.entryId, journalEntries.id))
    .where(and(...conditions))
    .groupBy(chartAccounts.code, chartAccounts.label, chartAccounts.class)
    .orderBy(asc(chartAccounts.class), asc(chartAccounts.code))

  let totalExpenses = 0
  let totalRevenue = 0
  const data = rows.map((r) => {
    if (r.class === "6") totalExpenses += parseFloat(r.totalDebit || "0")
    if (r.class === "7") totalRevenue += parseFloat(r.totalCredit || "0")
    return { ...r, amount: parseFloat((r.class === "6" ? r.totalDebit : r.totalCredit) || "0") }
  })

  return { data, totals: { totalExpenses, totalRevenue, netResult: totalRevenue - totalExpenses } }
}

async function balanceSheet(searchParams: URLSearchParams) {
  const conditions = dateRange(searchParams)
  conditions.push(sql`${chartAccounts.class} in ('1', '2', '3', '4', '5')`)

  const rows = await db.select({
    code: chartAccounts.code,
    label: chartAccounts.label,
    class: chartAccounts.class,
    type: chartAccounts.type,
    totalDebit: sql<string>`sum(${journalEntryLines.debit})`,
    totalCredit: sql<string>`sum(${journalEntryLines.credit})`,
  })
    .from(journalEntryLines)
    .innerJoin(chartAccounts, eq(journalEntryLines.accountId, chartAccounts.id))
    .innerJoin(journalEntries, eq(journalEntryLines.entryId, journalEntries.id))
    .where(and(...conditions))
    .groupBy(chartAccounts.code, chartAccounts.label, chartAccounts.class, chartAccounts.type)
    .orderBy(asc(chartAccounts.class), asc(chartAccounts.code))

  const income = await incomeStatement(searchParams)

  const accounts = rows.map((r) => ({
    ...r,
    totalDebit: parseFloat(r.totalDebit || "0"),
    totalCredit: parseFloat(r.totalCredit || "0"),
    balance: parseFloat(r.totalDebit || "0") - parseFloat(r.totalCredit || "0"),
  }))

  const result = income.totals.netResult

  const assets = accounts
    .filter((a) => (a.type === "asset" && a.balance > 0) || (a.type !== "asset" && a.balance < 0))
    .map((a) => ({ ...a, balance: Math.abs(a.balance) }))
  const liabilities = accounts
    .filter((a) => (a.type !== "asset" && a.balance > 0) || (a.type === "asset" && a.balance < 0))
    .map((a) => ({ ...a, balance: Math.abs(a.balance) }))

  const totalAssets = assets.reduce((s, a) => s + a.balance, 0)
  const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0) + result

  return {
    data: { assets, liabilities },
    totals: {
      totalAssets,
      totalLiabilities,
      result,
      difference: totalAssets - totalLiabilities,
    },
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const type = searchParams.get("type") || "trial"

    let payload
    if (type === "ledger") {
      payload = await generalLedger(searchParams)
    } else if (type === "income") {
      payload = await incomeStatement(searchParams)
    } else if (type === "balance") {
      payload = await balanceSheet(searchParams)
    } else {
      payload = await trialBalance(searchParams)
    }

    return NextResponse.json({ data: payload })
  } catch (error: any) {
    console.error("Failed to build report:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
