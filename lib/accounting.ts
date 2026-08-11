import { db } from "@/db"
import { chartAccounts, journalEntries, journalEntryLines, accountingMappings } from "@/db/schema"
import { eq, and, like, count } from "drizzle-orm"

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0]

export interface JournalLineInput {
  accountCode: string
  libelle?: string
  debit?: number | string
  credit?: number | string
}

function toNumber(value: number | string): number {
  return Math.round(parseFloat(String(value)) * 100) / 100
}

async function getNextEntryNumber(tx: Tx, date: Date): Promise<string> {
  const year = date.getFullYear()
  const prefix = `AC-${year}-`
  const [row] = await tx
    .select({ total: count() })
    .from(journalEntries)
    .where(like(journalEntries.entryNumber, `${prefix}%`))

  const next = (row?.total ?? 0) + 1
  return `${prefix}${String(next).padStart(5, "0")}`
}

async function resolveAccountId(tx: Tx, code: string): Promise<string> {
  const account = await tx.query.chartAccounts.findFirst({
    where: eq(chartAccounts.code, code),
  })

  if (!account) {
    throw new Error(`Compte comptable introuvable: ${code}`)
  }
  if (!account.isActive) {
    throw new Error(`Compte comptable inactif: ${code} (${account.label})`)
  }
  return account.id
}

export async function postJournalEntry(
  tx: Tx,
  opts: {
    entryDate?: Date
    label: string
    referenceType?: string
    referenceId?: string
    createdBy?: string | null
    lines: JournalLineInput[]
  }
) {
  if (!opts.lines || opts.lines.length < 2) {
    throw new Error("Une écriture doit contenir au moins deux lignes")
  }

  let totalDebit = 0
  let totalCredit = 0
  const resolvedLines = []

  for (const line of opts.lines) {
    const debit = line.debit !== undefined && line.debit !== null && line.debit !== 0 ? toNumber(line.debit) : 0
    const credit = line.credit !== undefined && line.credit !== null && line.credit !== 0 ? toNumber(line.credit) : 0

    if (debit < 0 || credit < 0) {
      throw new Error("Les montants ne peuvent pas être négatifs")
    }
    if (debit > 0 && credit > 0) {
      throw new Error(`La ligne ${line.accountCode} ne peut pas être débitée et créditée à la fois`)
    }
    if (debit === 0 && credit === 0) {
      throw new Error(`La ligne ${line.accountCode} doit avoir un montant`)
    }

    totalDebit += debit
    totalCredit += credit
    resolvedLines.push({
      accountId: await resolveAccountId(tx, line.accountCode),
      libelle: line.libelle || opts.label,
      debit: debit > 0 ? debit.toFixed(2) : "0",
      credit: credit > 0 ? credit.toFixed(2) : "0",
    })
  }

  if (Math.abs(totalDebit - totalCredit) > 0.01) {
    throw new Error(`Écriture non équilibrée: débit ${totalDebit.toFixed(2)} ≠ crédit ${totalCredit.toFixed(2)}`)
  }

  const entryDate = opts.entryDate || new Date()
  const entryNumber = await getNextEntryNumber(tx, entryDate)

  const [entry] = await tx
    .insert(journalEntries)
    .values({
      entryNumber,
      entryDate,
      label: opts.label,
      referenceType: opts.referenceType || null,
      referenceId: opts.referenceId || null,
      status: "posted",
      createdBy: opts.createdBy || null,
    })
    .returning()

  await tx.insert(journalEntryLines).values(
    resolvedLines.map((l) => ({ ...l, entryId: entry.id }))
  )

  return entry
}

export async function postAutoJournalEntry(
  tx: Tx,
  opts: {
    eventType: string
    fallbackEventType?: string
    amount: number | string
    entryDate?: Date
    label: string
    referenceType?: string
    referenceId?: string
    createdBy?: string | null
    debitCode?: string
    creditCode?: string
    debitLibelle?: string
    creditLibelle?: string
  }
) {
  const amount = toNumber(opts.amount)
  if (amount <= 0) return null

  let debitCode = opts.debitCode
  let creditCode = opts.creditCode

  if (!debitCode || !creditCode) {
    const mapping =
      (await tx.query.accountingMappings.findFirst({
        where: eq(accountingMappings.eventType, opts.eventType),
      })) ||
      (opts.fallbackEventType
        ? await tx.query.accountingMappings.findFirst({
            where: eq(accountingMappings.eventType, opts.fallbackEventType),
          })
        : undefined)

    if (!mapping || !mapping.isActive) {
      throw new Error(`Aucune règle comptable active pour l'événement "${opts.eventType}"`)
    }
    if (!debitCode) debitCode = mapping.debitCode
    if (!creditCode) creditCode = mapping.creditCode
  }

  return postJournalEntry(tx, {
    entryDate: opts.entryDate,
    label: opts.label,
    referenceType: opts.referenceType,
    referenceId: opts.referenceId,
    createdBy: opts.createdBy,
    lines: [
      { accountCode: debitCode, libelle: opts.debitLibelle || opts.label, debit: amount },
      { accountCode: creditCode, libelle: opts.creditLibelle || opts.label, credit: amount },
    ],
  })
}
