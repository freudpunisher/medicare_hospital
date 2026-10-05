/**
 * Demo data for the Billing → Reports screen.
 *
 * Generates a realistic multi-service activity so the report has something to
 * show: several services with their own medical acts, invoices whose lines span
 * multiple services, discounts, insurance splits, every invoice status, every
 * payment method, and operating expenses over the same period.
 *
 * Safe to re-run: anything created by a previous run is removed first (demo
 * invoices are tagged through `invoices.notes`).
 *
 *   pnpm db:seed:reports
 */

import { db } from './index'
import {
    services,
    medicalActs,
    patients,
    invoices,
    invoiceItems,
    payments,
    expenses,
    insurances,
} from './schema'
import { eq, sql, inArray } from 'drizzle-orm'

const DEMO_TAG = 'DEMO_RPT'

// ── Deterministic RNG so repeated runs produce the same figures ──────────────
let seedState = 20260101
const rnd = () => {
    seedState = (seedState * 1103515245 + 12345) % 2147483648
    return seedState / 2147483648
}
const int = (min: number, max: number) => min + Math.floor(rnd() * (max - min + 1))
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)]
const chance = (p: number) => rnd() < p

const round = (n: number) => Math.round(n)

// ── Catalogue ────────────────────────────────────────────────────────────────
type ActSeed = { code: string; name: string; price: number }

type ServiceSeed = {
    name: string
    code: string
    type:
        | 'consultation'
        | 'laboratory'
        | 'radiology'
        | 'general_surgery'
        | 'accommodation'
        | 'pharmacy'
    description: string
    acts: ActSeed[]
}

const CATALOGUE: ServiceSeed[] = [
    {
        name: 'Consultation Générale',
        code: 'SVC-CNS',
        type: 'consultation',
        description: 'Consultations médicales générales et de suivi',
        acts: [
            { code: 'ACT-CNS-001', name: 'Consultation générale adulte', price: 25000 },
            { code: 'ACT-CNS-002', name: 'Consultation pédiatrique', price: 20000 },
            { code: 'ACT-CNS-003', name: 'Consultation de suivi', price: 15000 },
            { code: 'ACT-CNS-004', name: 'Certificat médical', price: 10000 },
        ],
    },
    {
        name: 'Laboratoire',
        code: 'SVC-LAB',
        type: 'laboratory',
        description: 'Analyses biologiques de routine et spécialisé',
        acts: [
            { code: 'ACT-LAB-001', name: 'Numération formule sanguine (NFS)', price: 18000 },
            { code: 'ACT-LAB-002', name: 'Glycémie à jeun', price: 12000 },
            { code: 'ACT-LAB-003', name: 'CRP (protéine C réactive)', price: 15000 },
            { code: 'ACT-LAB-004', name: 'ECBU (ECBU + antibiogramme)', price: 14000 },
            { code: 'ACT-LAB-005', name: 'Widal (fièvre typhoïde)', price: 16000 },
        ],
    },
    {
        name: 'Imagerie & Radiologie',
        code: 'SVC-RAD',
        type: 'radiology',
        description: 'Radiographies, échographies et imagerie médicale',
        acts: [
            { code: 'ACT-RAD-001', name: 'Radiographie thorax', price: 25000 },
            { code: 'ACT-RAD-002', name: 'Radiographie abdomen', price: 28000 },
            { code: 'ACT-RAD-003', name: 'Échographie abdominale', price: 30000 },
            { code: 'ACT-RAD-004', name: 'Mammographie', price: 45000 },
            { code: 'ACT-RAD-005', name: 'Scanner (coupe computée) 6 coupes', price: 180000 },
        ],
    },
    {
        name: 'Chirurgie',
        code: 'SVC-CHI',
        type: 'general_surgery',
        description: 'Interventions chirurgicales programmed et urgente',
        acts: [
            { code: 'ACT-CHI-001', name: 'Appendicectomie', price: 450000 },
            { code: 'ACT-CHI-002', name: 'Cholécystectomie', price: 650000 },
            { code: 'ACT-CHI-003', name: 'Hernie inguinale', price: 380000 },
            { code: 'ACT-CHI-004', name: 'Curette utérine', price: 250000 },
        ],
    },
    {
        name: 'Hospitalisation',
        code: 'SVC-HOS',
        type: 'accommodation',
        description: 'Frais de séjour et prestations associées',
        acts: [
            { code: 'ACT-HOS-001', name: 'Chambre standard (par jour)', price: 35000 },
            { code: 'ACT-HOS-002', name: 'Chambre privée (par jour)', price: 70000 },
            { code: 'ACT-HOS-003', name: 'Chambre VIP (par jour)', price: 120000 },
            { code: 'ACT-HOS-004', name: 'Oxygène (par jour)', price: 15000 },
        ],
    },
    {
        name: 'Pharmacie',
        code: 'SVC-PHA',
        type: 'pharmacy',
        description: 'Médicaments et consommables (dispensation)',
        acts: [
            { code: 'ACT-PHA-001', name: 'Paracétamol 500mg (boîte de 20)', price: 5000 },
            { code: 'ACT-PHA-002', name: 'Amoxicilline 500mg (boîte de 12)', price: 12000 },
            { code: 'ACT-PHA-003', name: 'Seringue 5ml stérile', price: 2000 },
            { code: 'ACT-PHA-004', name: 'Pansement stérile', price: 8000 },
            { code: 'ACT-PHA-005', name: 'Vitamine C 20 comprimés', price: 9000 },
        ],
    },
]

const PATIENT_NAMES: [string, string, string][] = [
    ['Adrienne', 'NIYONKURU', 'F'],
    ['Bosco', 'NTAKIRENCYEMO', 'M'],
    ['Claudine', 'UWASE', 'F'],
    ['Dieudonné', 'HABIMANA', 'M'],
    ['Estelle', 'NIYIGANA', 'F'],
    ['Fabrice', 'IRAKAZE', 'M'],
    ['Gisèle', 'MUKAMANA', 'F'],
    ['Hervé', 'NDAYISENGA', 'M'],
    ['Immaculée', 'KAMASHO', 'F'],
    ['Jonas', 'RUKUNDO', 'M'],
    ['Lauraine', 'INGABIRE', 'F'],
    ['Moïse', 'BIZIMUNGA', 'M'],
]

const EXPENSE_SEEDS: { category: string; description: string }[] = [
    { category: 'Consommables', description: 'Achats de consommables médicaux' },
    { category: 'Consommables', description: 'Petit matériel de laboratoire' },
    { category: 'Médical', description: 'Réactifs et produits de laboratoire' },
    { category: 'Médical', description: 'Produits sanguins et oxygène' },
    { category: 'Maintenance', description: 'Maintenance des équipements médicaux' },
    { category: 'Maintenance', description: 'Entretien des locaux et du bloc' },
    { category: 'Utilities', description: 'Eau et électricité' },
    { category: 'Utilities', description: 'Internet et téléphonie' },
    { category: 'Services', description: 'Lavage, nettoyage et lessive' },
    { category: 'Services', description: 'Gardiennage et sécurité' },
    { category: 'Divers', description: 'Frais administratifs et bancaires' },
    { category: 'Divers', description: 'Transport et carburant' },
]

// Descriptions used by earlier revisions of this script. Expenses have no notes
// column, so the cleanup keys off the description; without these, rows written
// before a typo fix would survive every re-run and keep skewing the totals.
const LEGACY_DESCRIPTIONS = [
    'Produits sanguins et oxygen',
    'Lavage, nettoyage et_lessive',
]

const STATUSES: { value: 'paid' | 'pending' | 'partial' | 'cancelled'; weight: number }[] = [
    { value: 'paid', weight: 66 },
    { value: 'pending', weight: 19 },
    { value: 'partial', weight: 10 },
    { value: 'cancelled', weight: 5 },
]

const PAYMENT_METHODS: { value: string; weight: number }[] = [
    { value: 'cash', weight: 52 },
    { value: 'mobile_money', weight: 22 },
    { value: 'card', weight: 12 },
    { value: 'transfer', weight: 9 },
    { value: 'check', weight: 5 },
]

function weighted<T extends { weight: number }>(arr: T[]): T {
    const total = arr.reduce((a, x) => a + x.weight, 0)
    let r = rnd() * total
    for (const x of arr) {
        r -= x.weight
        if (r <= 0) return x
    }
    return arr[arr.length - 1]
}

function daysAgo(n: number, hour = 9) {
    const d = new Date()
    d.setDate(d.getDate() - n)
    d.setHours(hour, int(0, 59), 0, 0)
    return d
}

function refFor(d: Date) {
    const y = d.getFullYear()
    const m = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')
    return `INV-${y}${m}${day}-${int(1000, 9999)}`
}

async function main() {
    console.log('→ Génération des données de démonstration (rapport de facturation)\n')

    // ── 0. Remove data from a previous run ──────────────────────────────────
    const previous = await db
        .select({ id: invoices.id })
        .from(invoices)
        .where(eq(invoices.notes, DEMO_TAG))

    if (previous.length > 0) {
        const ids = previous.map((p) => p.id)
        await db.delete(payments).where(inArray(payments.invoiceId, ids))
        // invoice_items cascade on delete
        await db.delete(invoices).where(inArray(invoices.id, ids))
        console.log(`  · ${ids.length} facture(s) de la précédente exécution supprimée(s)`)
    }

    // `expenses` has no notes column, so demo rows are identified by their
    // descriptions. Without this, re-running would stack expenses on top of
    // each other and quietly wreck the profit figure.
    const staleExpenses = await db
        .delete(expenses)
        .where(
            inArray(expenses.description, [
                ...EXPENSE_SEEDS.map((e) => e.description),
                ...LEGACY_DESCRIPTIONS,
            ]),
        )
        .returning({ id: expenses.id })
    if (staleExpenses.length > 0) {
        console.log(`  · ${staleExpenses.length} dépense(s) de la précédente exécution supprimée(s)`)
    }

    // ── 1. Services + medical acts ──────────────────────────────────────────
    const existingServices = await db.select().from(services)
    const serviceIdByName = new Map(existingServices.map((s) => [s.name, s.id]))

    const newServices: (typeof services.$inferInsert)[] = []
    for (const s of CATALOGUE) {
        if (!serviceIdByName.has(s.name)) newServices.push({
            name: s.name,
            code: s.code,
            type: s.type,
            description: s.description,
            isBillable: true,
            isActive: true,
        })
    }
    if (newServices.length > 0) {
        await db.insert(services).values(newServices)
    }

    const allServices = await db.select().from(services)
    for (const s of allServices) serviceIdByName.set(s.name, s.id)
    console.log(`  · services : ${allServices.length} au total (+${newServices.length})`)

    const existingActs = await db.select().from(medicalActs)
    const actByCode = new Map(existingActs.map((a) => [a.code, a]))

    const newActs: (typeof medicalActs.$inferInsert)[] = []
    for (const s of CATALOGUE) {
        const sid = serviceIdByName.get(s.name)!
        for (const a of s.acts) {
            if (!actByCode.has(a.code)) {
                newActs.push({ code: a.code, name: a.name, serviceId: sid, basePrice: String(a.price), isActive: true })
            }
        }
    }
    if (newActs.length > 0) await db.insert(medicalActs).values(newActs)

    const allActs = await db.select().from(medicalActs)
    for (const a of allActs) actByCode.set(a.code, a)
    console.log(`  · actes médicaux : ${allActs.length} au total (+${newActs.length})`)

    // Acts grouped per service, used to build multi-service invoices.
    const actsPerService = new Map<string, typeof medicalActs.$inferSelect[]>()
    for (const a of allActs) {
        const list = actsPerService.get(a.serviceId) ?? []
        list.push(a)
        actsPerService.set(a.serviceId, list)
    }
    const seededServices = CATALOGUE.map((s) => ({
        name: s.name,
        acts: actsPerService.get(serviceIdByName.get(s.name)!) ?? [],
    })).filter((s) => s.acts.length > 0)

    // ── 2. Patients ─────────────────────────────────────────────────────────
    const [insurance] = await db.select().from(insurances).limit(1)

    const existingPatients = await db.select().from(patients)
    const patientPool = [...existingPatients]

    // NB: `patient_number` is a serial — let Postgres assign it so the sequence
    // stays in sync with rows inserted by the application.
    const newPatients: (typeof patients.$inferInsert)[] = []
    const existingEmails = new Set(existingPatients.map((p) => p.email?.toLowerCase()).filter(Boolean))
    PATIENT_NAMES.forEach(([first, last, gender]) => {
        if (chance(0.35) && patientPool.length > 0) return // reuse an existing patient
        const email = `${first.toLowerCase()}.${last.toLowerCase()}@example.bi`
        if (existingEmails.has(email)) return // already created by a previous run
        const insured = chance(0.45)
        newPatients.push({
            firstName: first,
            lastName: last,
            dateOfBirth: `${int(1975, 2018)}-${String(int(1, 12)).padStart(2, '0')}-${String(int(1, 28)).padStart(2, '0')}`,
            gender: gender === 'F' ? 'Female' : 'Male',
            phone: `+257 ${int(22, 79)} ${int(10, 99)} ${int(10, 99)} ${int(10, 99)}`,
            email: email,
            address: 'Bujumbura, Burundi',
            isInsured: insured,
            insuranceId: insured && insurance ? insurance.id : null,
            insuranceNumber: insured && insurance ? `POL-${int(100000, 999999)}` : null,
            insuranceCardNumber: insured && insurance ? `CARD-${int(10000, 99999)}` : null,
            coverageRate: insured ? pick(['0.75', '0.80', '0.85', '1.00']) : '0',
            isCorporateEmployee: false,
        })
    })

    if (newPatients.length > 0) {
        const inserted = await db.insert(patients).values(newPatients).returning()
        patientPool.push(...inserted)
    }
    console.log(`  · patients : ${patientPool.length} au total (+${newPatients.length})`)

    // ── 3. Invoices ─────────────────────────────────────────────────────────
    // Half of the invoices land inside the last 30 days so the report's default
    // window is never empty.
    const INVOICE_COUNT = 66
    const invoiceRows: (typeof invoices.$inferInsert)[] = []
    const paymentRows: (typeof payments.$inferInsert)[] = []

    const usedRefs = new Set<string>()
    for (let i = 0; i < INVOICE_COUNT; i++) {
        const ageDays = i < 36 ? int(0, 29) : 30 + int(0, 89)
        const when = daysAgo(ageDays, int(8, 17))
        const patient = pick(patientPool)

        // 1 to 4 lines, drawn from 1 to 3 different services
        const lineCount = int(1, 4)
        const servicesUsed = new Set<string>()
        const lines: { actId: string; qty: number; unit: number; total: number }[] = []

        for (let l = 0; l < lineCount; l++) {
            const svc = pick(seededServices)
            if (!svc) break
            servicesUsed.add(svc.name)
            const act = pick(svc.acts)
            if (!act) continue
            const qty = chance(0.18) ? int(2, 5) : 1
            const unit = round(Number(act.basePrice))
            lines.push({ actId: act.id, qty, unit, total: unit * qty })
        }
        if (lines.length === 0) continue

        const total = lines.reduce((a, l) => a + l.total, 0)

        // Insurance split: patient + insurance = total (matches existing rows).
        const insured = Boolean(patient.isInsured && patient.insuranceId)
        let insuranceAmount = 0
        let patientAmount = total
        if (insured && chance(0.75)) {
            const rate = Number(patient.coverageRate || '0.75')
            insuranceAmount = round(total * rate)
            patientAmount = total - insuranceAmount
        }

        // Discount is a separate memo figure, allocated proportionally by the API.
        const discountAmount = chance(0.22) ? round(total * pick([0.05, 0.1, 0.15])) : 0

        const status = weighted(STATUSES).value

        let ref = refFor(when)
        let guard = 0
        while (usedRefs.has(ref) && guard++ < 50) ref = refFor(when)
        usedRefs.add(ref)

        invoiceRows.push({
            invoiceNumber: ref,
            patientId: patient.id,
            totalAmount: String(total),
            patientAmount: String(patientAmount),
            insuranceAmount: String(insuranceAmount),
            discountAmount: String(discountAmount),
            status,
            notes: DEMO_TAG,
            createdAt: when,
        })

        // Payment rows — cancelled invoices are never settled.
        if (status === 'paid' || status === 'partial') {
            const method = weighted(PAYMENT_METHODS).value
            const amount = status === 'paid' ? patientAmount : round(patientAmount * pick([0.3, 0.5, 0.7]))
            paymentRows.push({
                invoiceId: '__PENDING__', // patched right after insert
                patientId: patient.id,
                amount: String(amount),
                paymentMethod: method,
                referenceNumber: `REC-${int(100000, 999999)}`,
                createdAt: new Date(when.getTime() + int(5, 300) * 60000),
            })
            // remember the pairing for the patch pass below
            ;(paymentRows[paymentRows.length - 1] as any)._ref = ref
        }

        // stash lines for the item insert
        ;(invoiceRows[invoiceRows.length - 1] as any)._lines = lines
    }

    const created = await db.insert(invoices).values(invoiceRows).returning()
    const idByRef = new Map(created.map((r) => [r.invoiceNumber, r.id]))
    console.log(`  · factures : ${created.length}`)

    // ── 4. Invoice lines ────────────────────────────────────────────────────
    const itemRows: (typeof invoiceItems.$inferInsert)[] = []
    for (const inv of invoiceRows as any[]) {
        const invoiceId = idByRef.get(inv.invoiceNumber)
        if (!invoiceId) continue
        for (const l of inv._lines) {
            itemRows.push({
                invoiceId,
                medicalActId: l.actId,
                quantity: String(l.qty),
                unitPrice: String(l.unit),
                totalPrice: String(l.total),
                createdAt: inv.createdAt,
            })
        }
    }
    if (itemRows.length > 0) await db.insert(invoiceItems).values(itemRows)
    console.log(`  · lignes de facture : ${itemRows.length}`)

    // ── 5. Payments ─────────────────────────────────────────────────────────
    const finalPayments = (paymentRows as any[]).map((p) => ({
        invoiceId: idByRef.get(p._ref)!,
        patientId: p.patientId,
        amount: p.amount,
        paymentMethod: p.paymentMethod,
        referenceNumber: p.referenceNumber,
        createdAt: p.createdAt,
    }))
    if (finalPayments.length > 0) await db.insert(payments).values(finalPayments)
    console.log(`  · paiements : ${finalPayments.length}`)

    // ── 6. Expenses, sized against each month's actual revenue ────────────
    // Expenses are derived from activity rather than hard-coded: for every month
    // we take that month's billed revenue (demo + pre-existing invoices, since
    // expenses belong to the clinic as a whole) and book ~52% of it as running
    // costs. A flat monthly figure would make the report look wrong in any
    // window where activity differs from the average — e.g. a surgery-heavy
    // month showing a 78% margin.
    const CHARGE_RATIO = 0.52
    const now = new Date()

    const monthlyRevenue = (await db.execute(sql`
            select to_char(date_trunc('month', ${invoices.createdAt}), 'YYYY-MM') as ym,
                   coalesce(sum(${invoices.totalAmount}), 0)::float8 as rev
            from ${invoices}
            where ${invoices.createdAt} >= date_trunc('month', now()) - interval '5 months'
              and ${invoices.createdAt} <= now()
            group by 1
            order by 1
        `)) as unknown as { ym: string; rev: string | number }[]

    const expenseRows: (typeof expenses.$inferInsert)[] = []
    for (const { ym, rev } of monthlyRevenue) {
        const target = Number(rev) * CHARGE_RATIO
        if (target <= 0) continue

        // Spread the target across the expense lines with random weights so the
        // split differs slightly from month to month.
        const weights = EXPENSE_SEEDS.map(() => 0.6 + rnd())
        const weightSum = weights.reduce((a, b) => a + b, 0)

        const [year, month] = ym.split('-').map(Number)
        const daysInMonth = new Date(year, month, 0).getDate()
        const isCurrentMonth = ym === `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const lastDay = isCurrentMonth ? now.getDate() : daysInMonth

        EXPENSE_SEEDS.forEach((e, i) => {
            const when = new Date(year, month - 1, int(1, Math.max(1, lastDay)))
            when.setHours(int(8, 17), int(0, 59), 0, 0)
            if (when > now) when.setTime(now.getTime() - int(1, 240) * 60000)

            expenseRows.push({
                description: e.description,
                category: e.category,
                amount: String(round((target * weights[i]) / weightSum)),
                createdAt: when,
            })
        })
        console.log(`  · charges ${ym} : ${target.toLocaleString('fr-FR')} BIF (${CHARGE_RATIO * 100}% du CA du mois)`)
    }
    if (expenseRows.length > 0) await db.insert(expenses).values(expenseRows)
    console.log(`  · dépenses : ${expenseRows.length}`)

    // ── Summary ─────────────────────────────────────────────────────────────
    const [agg] = await db
        .select({
            revenue: sql<string>`coalesce(sum(${invoices.totalAmount}), 0)`,
            invoices: sql<number>`count(*)::int`,
        })
        .from(invoices)
        .where(eq(invoices.notes, DEMO_TAG))

    const [exp] = await db
        .select({ total: sql<string>`coalesce(sum(${expenses.amount}), 0)` })
        .from(expenses)

    console.log('\n✓ Données de démonstration créées')
    console.log(`  · CA sur 4 mois        : ${round(Number(agg.revenue)).toLocaleString('fr-FR')} BIF`)
    console.log(`  · Dépenses (4 mois)    : ${round(Number(exp.total)).toLocaleString('fr-FR')} BIF`)
    console.log('\→ Ouvrez /billing/reports et appliquez les filtres pour voir le rapport.')

    process.exit(0)
}

main().catch((err) => {
    console.error('\n✗ Échec de la génération :', err?.cause?.message ?? err)
    process.exit(1)
})
