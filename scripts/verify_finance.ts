import { db } from "../db"
import { pharmacySales, purchaseOrders, invoices, expenses } from "../db/schema"

async function verifyFinance() {
    console.log("--- Finance API Verification ---")

    // 1. Check Expenses
    const exps = await db.query.expenses.findMany({ limit: 5 })
    console.log(`Expenses found: ${exps.length}`)
    exps.forEach(e => console.log(` - ${e.description}: ${e.amount} FBU`))

    // 2. Check Summary Aggregation (Mocking the logic of the API)
    const now = new Date("2026-06-14T15:00:07+02:00")
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    const pSales = await db.query.pharmacySales.findMany()
    console.log(`Total Pharmacy Sales records: ${pSales.length}`)

    const pOrders = await db.query.purchaseOrders.findMany()
    console.log(`Total Purchase Orders: ${pOrders.length}`)

    const invs = await db.query.invoices.findMany()
    console.log(`Total Invoices: ${invs.length}`)

    console.log("--- Verification Complete ---")
}

verifyFinance().catch(console.error)
