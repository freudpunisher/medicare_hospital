"use client"

import { format } from "date-fns"
import { fr } from "date-fns/locale"

interface ReportRow {
    id: string
    invoiceNumber: string
    totalAmount: string
    insuranceAmount: string
    patientAmount: string
    discountAmount: string
    status: string
    createdAt: string
    paymentMethod: string | null
    patient: { id: string; firstName: string; lastName: string }
}

interface ServiceRow {
    serviceId: string
    serviceName: string
    serviceCode: string
    actCount: number
    lineCount: number
    quantity: number
    gross: number
    discount: number
    net: number
    patient: number
    insurance: number
    collected: number
    pending: number
    share: number
}

interface ExpenseRow {
    category: string
    amount: number
    count: number
}

interface Summary {
    totalBrut: number
    totalDiscount: number
    netRevenue: number
    totalPatient: number
    totalInsurance: number
    collected: number
    pending: number
    count: number
    totalExpenses: number
    profit: number
    margin: number
    serviceCount: number
    filteredService: boolean
}

interface Filters {
    startDate: string
    endDate: string
    status: string
    paymentMethod: string
    serviceId: string
}

const STATUS_LABEL: Record<string, string> = {
    paid: "Payée",
    pending: "En attente",
    partial: "Partielle",
    cancelled: "Annulée",
}

const METHOD_LABEL: Record<string, string> = {
    cash: "Espèces",
    card: "Carte",
    mobile_money: "Mobile Money",
    check: "Chèque",
    transfer: "Virement",
    insurance: "Assurance",
    loan: "Crédit",
}

/** 1 234 567 — accounting style, no decimals, thin-space grouping. */
function money(n: number | string | null | undefined) {
    const v = Number(n ?? 0)
    if (!Number.isFinite(v)) return "0"
    return Math.round(v).toLocaleString("fr-FR").replace(/[\u202f\u00a0]/g, "\u202F")
}

function pct(n: number | null | undefined) {
    const v = Number(n ?? 0)
    const safe = Number.isFinite(v) ? v : 0
    // Always one decimal: a column mixing "10 %" and "70,8 %" reads as an error.
    return `${safe.toLocaleString("fr-FR", { minimumFractionDigits: 1, maximumFractionDigits: 1 })} %`
}

/** "1 234 567,00" keeps two decimals, used only where precision is expected. */
function money2(n: number | string | null | undefined) {
    const v = Number(n ?? 0)
    if (!Number.isFinite(v)) return "0,00"
    return v.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace(/[\u202f\u00a0]/g, "\u202F")
}

function Kpi({ label, value, sub, tone }: { label: string; value: string; sub?: string; tone?: "pos" | "neg" }) {
    return (
        <div className="kpi">
            <div className="kpi-label">{label}</div>
            <div className={`kpi-value${tone ? ` kpi-${tone}` : ""}`}>{value}</div>
            {sub ? <div className="kpi-sub">{sub}</div> : null}
        </div>
    )
}

export function PrintReport({
    data,
    byService,
    expenseRows,
    summary,
    filters,
    services,
    generatedAt,
    printedBy,
}: {
    data: ReportRow[]
    byService: ServiceRow[]
    expenseRows: ExpenseRow[]
    summary: Summary | null
    filters: Filters
    services: { id: string; name: string }[]
    generatedAt: Date
    printedBy?: string
}) {
    const serviceLabel =
        filters.serviceId === "all"
            ? "Tous les services"
            : services.find((s) => s.id === filters.serviceId)?.name ?? "—"

    const statusLabel = filters.status === "all" ? "Tous" : (STATUS_LABEL[filters.status] ?? filters.status)
    const methodLabel =
        filters.paymentMethod === "all" ? "Tous" : (METHOD_LABEL[filters.paymentMethod] ?? filters.paymentMethod)

    const safeDate = (v: string) => {
        const d = new Date(v)
        return Number.isNaN(d.getTime()) ? "—" : format(d, "dd/MM/yyyy", { locale: fr })
    }

    return (
        <div className="rp">
            <style jsx global>{`
                @media print {
                    html, body {
                        background: #fff !important;
                        color: #000 !important;
                        font-size: 10pt;
                    }
                    .rp { display: block !important; }

                    .rp * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }

                    .rp thead { display: table-header-group; }
                    /* tfoot must NOT repeat: the grand total belongs once, at the end */
                    .rp tfoot { display: table-row-group; }
                    .rp tr { break-inside: avoid; page-break-inside: avoid; }
                    .rp h1, .rp h2, .rp h3 { break-after: avoid; page-break-after: avoid; }
                    .rp .sec { break-inside: auto; }
                    .rp .page-break { break-before: page; page-break-before: always; }
                    .rp .avoid-break { break-inside: avoid; page-break-inside: avoid; }
                    .rp .tnum { font-variant-numeric: tabular-nums; }

                    .rp table { width: 100%; border-collapse: collapse; }
                    .rp thead th {
                        background: #f1f5f9 !important;
                        border-bottom: 1.5pt solid #0f172a;
                        font-size: 7.5pt;
                        text-transform: uppercase;
                        letter-spacing: .06em;
                        color: #0f172a;
                        padding: 5pt 4pt;
                        text-align: left;
                        vertical-align: bottom;
                    }
                    .rp tbody td {
                        border-bottom: .5pt solid #cbd5e1;
                        padding: 3.5pt 4pt;
                        font-size: 8.5pt;
                        vertical-align: top;
                    }
                    .rp .num { text-align: right; white-space: nowrap; }
                    .rp .ctr { text-align: center; }
                    .rp tbody tr:nth-child(even) { background: #fafafa !important; }

                    .rp tr.total td {
                        border-top: 1.5pt solid #0f172a;
                        border-bottom: 3pt double #0f172a;
                        font-weight: 700;
                        background: #fff !important;
                        padding-top: 5pt;
                        padding-bottom: 5pt;
                    }
                    .rp tr.sub td { background: #fff !important; font-weight: 600; }
                }

                .rp { display: none; }

                .rp-document { color: #0f172a; }
                .rp-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12pt; }
                .rp-org { display: flex; gap: 10pt; align-items: flex-start; }
                .rp-org img { width: 58pt; height: 58pt; object-fit: contain; }
                .rp-org-name { font-size: 13pt; font-weight: 800; letter-spacing: -.01em; text-transform: uppercase; line-height: 1.15; }
                .rp-org-tag { font-size: 7.5pt; font-style: italic; color: #475569; margin-top: 1pt; }
                .rp-org-addr { font-size: 7pt; color: #64748b; margin-top: 3pt; max-width: 210pt; line-height: 1.35; }
                .rp-head-right { text-align: right; font-size: 7.5pt; color: #475569; line-height: 1.5; }
                .rp-head-right b { color: #0f172a; }

                .rp-rule { border-top: 2.5pt solid #0f172a; margin: 7pt 0 0; }
                .rp-rule-thin { border-top: .5pt solid #94a3b8; margin-top: 2pt; }

                .rp-title { margin-top: 10pt; }
                .rp-title h1 { font-size: 12.5pt; font-weight: 800; text-transform: uppercase; letter-spacing: .04em; }
                .rp-title .rp-sub { font-size: 8pt; color: #475569; margin-top: 2pt; }

                .rp-meta { display: flex; flex-wrap: wrap; gap: 0; margin-top: 9pt; border: .5pt solid #cbd5e1; }
                .rp-meta div { padding: 4pt 8pt; border-right: .5pt solid #cbd5e1; min-width: 96pt; }
                .rp-meta div:last-child { border-right: 0; }
                .rp-meta dt { font-size: 6.5pt; text-transform: uppercase; letter-spacing: .08em; color: #64748b; }
                .rp-meta dd { font-size: 8.5pt; font-weight: 700; margin-top: 1pt; }

                .rp-sec { margin-top: 14pt; }
                .rp-sec h2 {
                    font-size: 9pt; font-weight: 800; text-transform: uppercase; letter-spacing: .08em;
                    border-bottom: 1pt solid #0f172a; padding-bottom: 3pt; margin-bottom: 7pt;
                }
                .rp-sec h2 span { color: #64748b; font-weight: 600; letter-spacing: 0; text-transform: none; font-size: 7.5pt; }

                .rp-kpis { display: grid; grid-template-columns: repeat(4, 1fr); border: .5pt solid #cbd5e1; }
                .rp-kpis .kpi { padding: 6pt 8pt; border-right: .5pt solid #cbd5e1; }
                .rp-kpis .kpi:last-child { border-right: 0; }
                .kpi-label { font-size: 6.5pt; text-transform: uppercase; letter-spacing: .07em; color: #64748b; }
                .kpi-value { font-size: 12pt; font-weight: 800; margin-top: 2pt; letter-spacing: -.02em; }
                .kpi-sub { font-size: 6.5pt; color: #64748b; margin-top: 1.5pt; }
                .kpi-pos { color: #15803d; }
                .kpi-neg { color: #b91c1c; }

                .rp-pl { margin-top: 8pt; border: .5pt solid #cbd5e1; }
                .rp-pl-row { display: flex; justify-content: space-between; align-items: baseline; padding: 3.5pt 8pt; border-bottom: .5pt dotted #cbd5e1; }
                .rp-pl-row:last-child { border-bottom: 0; }
                .rp-pl-row .lbl { font-size: 8.5pt; }
                .rp-pl-row .lbl.ind { padding-left: 12pt; color: #334155; font-size: 8pt; }
                .rp-pl-row .val { font-size: 8.5pt; font-weight: 700; font-variant-numeric: tabular-nums; white-space: nowrap; }
                .rp-pl-row.is-total { background: #f8fafc; border-top: .5pt solid #cbd5e1; border-bottom: 0; }
                .rp-pl-row.is-total .lbl, .rp-pl-row.is-total .val { font-weight: 800; }
                .rp-pl-row.is-net { border-top: 1.5pt solid #0f172a; background: #fff; }
                .rp-pl-row.is-net .lbl { font-size: 9pt; font-weight: 800; text-transform: uppercase; letter-spacing: .05em; }
                .rp-pl-row.is-net .val { font-size: 11pt; font-weight: 800; }
                .rp-pl-row .neg { color: #b91c1c; }

                .rp-note { margin-top: 6pt; font-size: 6.8pt; color: #64748b; font-style: italic; line-height: 1.4; }
                .rp-warn {
                    margin-top: 7pt; padding: 5pt 7pt; border: .5pt solid #b45309; border-left: 2.5pt solid #b45309;
                    background: #fffbeb; font-size: 7.2pt; color: #78350f; line-height: 1.4;
                }

                .rp-empty { padding: 12pt; text-align: center; font-size: 8pt; font-style: italic; color: #64748b; }
                .rp-nowrap { white-space: nowrap; }
                .rp-soft { color: #64748b; }
                .rp-strong { font-weight: 700; }

                .rp-sign { display: flex; justify-content: space-between; gap: 20pt; margin-top: 22pt; }
                .rp-sign div { width: 45%; text-align: center; font-size: 7.5pt; }
                .rp-sign .line { margin-top: 26pt; border-top: .5pt solid #94a3b8; padding-top: 3pt; color: #475569; }

                .rp-foot {
                    position: fixed; bottom: 0; left: 0; right: 0;
                    border-top: .5pt solid #cbd5e1; padding-top: 3pt;
                    display: flex; justify-content: space-between;
                    font-size: 6.5pt; color: #64748b;
                }
            `}</style>

            <div className="rp-document">
                {/* ── Letterhead ─────────────────────────────────────────── */}
                <div className="rp-head">
                    <div className="rp-org">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src="/images/logo.png" alt="" />
                        <div>
                            <div className="rp-org-name">Clinique Médico-Dentaire<br />Le Sourire</div>
                            <div className="rp-org-tag">Service de Santé d&apos;Excellence</div>
                            <div className="rp-org-addr">
                                Africana House, Kigobe, Boulevard Mwambutsta<br />
                                Bujumbura, Burundi
                            </div>
                        </div>
                    </div>
                    <div className="rp-head-right">
                        <div>NIF : <b>500253456</b></div>
                        <div>RCCM : <b>19 2200 123 B</b></div>
                        <div>Tél. : <b>+257 22 22 00 00</b></div>
                        <div style={{ marginTop: 6 }}>
                                Édité le :<br />
                                <b>{format(generatedAt, "dd/MM/yyyy HH:mm", { locale: fr })}</b>
                            </div>
                            {printedBy ? (
                                <div>
                                    Par : <b>{printedBy}</b>
                                </div>
                            ) : null}
                        </div>
                </div>
                <div className="rp-rule" />
                <div className="rp-rule-thin" />

                {/* ── Title + parameters ─────────────────────────────────── */}
                <div className="rp-title">
                    <h1>Rapport de Facturation et de Rentabilité</h1>
                    <div className="rp-sub">
                        Chiffre d&apos;affaires par service, charges de la période et résultat net
                    </div>
                </div>

                <dl className="rp-meta">
                    <div>
                        <dt>Période</dt>
                        <dd>
                            {safeDate(filters.startDate)} → {safeDate(filters.endDate)}
                        </dd>
                    </div>
                    <div>
                        <dt>Service</dt>
                        <dd>{serviceLabel}</dd>
                    </div>
                    <div>
                        <dt>Statut</dt>
                        <dd>{statusLabel}</dd>
                    </div>
                    <div>
                        <dt>Mode de paiement</dt>
                        <dd>{methodLabel}</dd>
                    </div>
                    <div>
                        <dt>Factures</dt>
                        <dd>{summary?.count ?? 0}</dd>
                    </div>
                </dl>

                {/* ── KPI band ───────────────────────────────────────────── */}
                {summary ? (
                    <div className="rp-sec avoid-break">
                        <h2>
                            Synthèse <span>— montants en BIF</span>
                        </h2>
                        <div className="rp-kpis">
                            <Kpi
                                label="Chiffre d'affaires net"
                                value={money(summary.netRevenue)}
                                sub={`Brut ${money(summary.totalBrut)}${summary.totalDiscount ? ` · rem. ${money(summary.totalDiscount)}` : ""}`}
                            />
                            <Kpi
                                label="Charges de la période"
                                value={money(summary.totalExpenses)}
                                sub={`${expenseRows.length} catégorie${expenseRows.length > 1 ? "s" : ""}`}
                            />
                            <Kpi
                                label="Résultat net"
                                value={money(summary.profit)}
                                tone={summary.profit >= 0 ? "pos" : "neg"}
                                sub="CA net − charges"
                            />
                            <Kpi
                                label="Marge nette"
                                value={pct(summary.margin)}
                                tone={summary.margin >= 0 ? "pos" : "neg"}
                                sub={`${summary.serviceCount} service${summary.serviceCount > 1 ? "s" : ""}`}
                            />
                        </div>
                    </div>
                ) : null}

                {/* ── 1. Revenue by service ──────────────────────────────── */}
                <section className="rp-sec">
                    <h2>
                        1. Chiffre d&apos;affaires par service{" "}
                        <span>
                            — {summary?.filteredService ? "service filtré" : "tous services confondus"}
                        </span>
                    </h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Service</th>
                                <th className="ctr">Actes</th>
                                <th className="ctr">Qté</th>
                                <th className="num">CA brut</th>
                                <th className="num">Remise</th>
                                <th className="num">CA net</th>
                                <th className="num">Part</th>
                                <th className="num">Dont assurance</th>
                                <th className="num">Reste à recouvrer</th>
                            </tr>
                        </thead>
                        <tbody>
                            {byService.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="rp-empty">
                                        Aucun revenu enregistré sur la période.
                                    </td>
                                </tr>
                            ) : (
                                byService.map((s) => (
                                    <tr key={s.serviceId}>
                                        <td>
                                            <span className="rp-strong">{s.serviceName}</span>
                                            <span className="rp-soft"> · {s.serviceCode}</span>
                                        </td>
                                        <td className="ctr tnum">{s.actCount}</td>
                                        <td className="ctr tnum">{money(s.quantity)}</td>
                                        <td className="num tnum">{money(s.gross)}</td>
                                        <td className="num tnum">{s.discount > 0 ? `− ${money(s.discount)}` : "—"}</td>
                                        <td className="num tnum rp-strong">{money(s.net)}</td>
                                        <td className="num tnum">{pct(s.share)}</td>
                                        <td className="num tnum">{money(s.insurance)}</td>
                                        <td className="num tnum">{s.pending > 0 ? money(s.pending) : "—"}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {byService.length > 0 ? (
                            <tfoot>
                                <tr className="total">
                                    <td>Total général</td>
                                    <td className="ctr">—</td>
                                    <td className="ctr">—</td>
                                    <td className="num tnum">{money(summary?.totalBrut ?? 0)}</td>
                                    <td className="num tnum">{summary?.totalDiscount ? `− ${money(summary.totalDiscount)}` : "—"}</td>
                                    <td className="num tnum">{money(summary?.netRevenue ?? 0)}</td>
                                    <td className="num tnum">{pct(100)}</td>
                                    <td className="num tnum">{money(summary?.totalInsurance ?? 0)}</td>
                                    <td className="num tnum">{money(summary?.pending ?? 0)}</td>
                                </tr>
                            </tfoot>
                        ) : null}
                    </table>
                </section>

                {/* ── 2. Compte de résultat ──────────────────────────────── */}
                {summary ? (
                    <section className="rp-sec avoid-break">
                        <h2>
                            2. Compte de résultat <span>— charges de la période</span>
                        </h2>
                        <div className="rp-pl">
                            <div className="rp-pl-row">
                                <span className="lbl">Chiffre d&apos;affaires brut</span>
                                <span className="val tnum">{money(summary.totalBrut)}</span>
                            </div>
                            {summary.totalDiscount > 0 ? (
                                <div className="rp-pl-row">
                                    <span className="lbl ind">Remises accordées</span>
                                    <span className="val tnum neg">− {money(summary.totalDiscount)}</span>
                                </div>
                            ) : null}
                            <div className="rp-pl-row is-total">
                                <span className="lbl">Chiffre d&apos;affaires net</span>
                                <span className="val tnum">{money(summary.netRevenue)}</span>
                            </div>

                            {expenseRows.length > 0 ? (
                                <>
                                    <div className="rp-pl-row" style={{ marginTop: 4 }}>
                                        <span className="lbl">
                                            <b>Charges de la période</b>
                                        </span>
                                        <span />
                                    </div>
                                    {expenseRows.map((e, i) => (
                                        <div className="rp-pl-row" key={`${e.category}-${i}`}>
                                            <span className="lbl ind">
                                                {e.category} <span className="rp-soft">({e.count})</span>
                                            </span>
                                            <span className="val tnum">{money(e.amount)}</span>
                                        </div>
                                    ))}
                                    <div className="rp-pl-row is-total">
                                        <span className="lbl">Total charges</span>
                                        <span className="val tnum">{money(summary.totalExpenses)}</span>
                                    </div>
                                </>
                            ) : (
                                <div className="rp-pl-row is-total">
                                    <span className="lbl">Total charges</span>
                                    <span className="val tnum">0</span>
                                </div>
                            )}

                            <div className={`rp-pl-row is-net${summary.profit < 0 ? " is-loss" : ""}`}>
                                <span className="lbl">
                                    {summary.profit >= 0 ? "Résultat net" : "Perte nette"}
                                    <span className="rp-soft" style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>
                                        {" "}
                                        · marge {pct(summary.margin)}
                                    </span>
                                </span>
                                <span className={`val tnum${summary.profit >= 0 ? " kpi-pos" : " neg"}`}>
                                    {money(summary.profit)}
                                </span>
                            </div>
                        </div>

                        {summary.filteredService ? (
                            <div className="rp-warn">
                                <b>Lecture :</b> un filtre service est actif. Les charges ci-dessus restent le total de la
                                période — elles ne sont rattachées à aucun service dans la comptabilité. Le résultat net
                                affiché n&apos;est donc pas un profit propre à « {serviceLabel} ». Retirez le filtre pour
                                obtenir le compte de résultat réel de l&apos;établissement.
                            </div>
                        ) : (
                            <p className="rp-note">
                                Les charges sont saisies par catégorie (consommables, maintenance, services, médical,
                                utilités, divers) et ne sont rattachées à aucun service : le résultat net est donc établi
                                au niveau de la période. Les montants sont exprimés en BIF et arrondis à l&apos;unité
                                supérieure.
                            </p>
                        )}
                    </section>
                ) : null}

                {/* ── 3. Encaissements (secondary KPIs) ─────────────────── */}
                {summary ? (
                    <section className="rp-sec avoid-break">
                        <h2>
                            3. Encaissements et créances <span>— répartition de la part patient</span>
                        </h2>
                        <table>
                            <thead>
                                <tr>
                                    <th>Nature</th>
                                    <th className="num">Montant</th>
                                    <th className="num">Part</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Part patient — encaissée (factures payées)</td>
                                    <td className="num tnum">{money(summary.collected)}</td>
                                    <td className="num tnum">
                                        {pct(summary.totalPatient > 0 ? (summary.collected / summary.totalPatient) * 100 : 0)}
                                    </td>
                                </tr>
                                <tr>
                                    <td>Part patient — reste à recouvrer (factures en attente)</td>
                                    <td className="num tnum">{money(summary.pending)}</td>
                                    <td className="num tnum">
                                        {pct(summary.totalPatient > 0 ? (summary.pending / summary.totalPatient) * 100 : 0)}
                                    </td>
                                </tr>
                                <tr>
                                    <td>Part assurance — à demander aux bordereaux</td>
                                    <td className="num tnum">{money(summary.totalInsurance)}</td>
                                    <td className="num tnum">
                                        {pct(
                                            summary.netRevenue > 0 ? (summary.totalInsurance / summary.netRevenue) * 100 : 0
                                        )}
                                    </td>
                                </tr>
                            </tbody>
                            <tfoot>
                                <tr className="total">
                                    <td>Total part patient</td>
                                    <td className="num tnum">{money(summary.totalPatient)}</td>
                                    <td className="num tnum">{pct(100)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </section>
                ) : null}

                {/* ── 4. Invoice detail ──────────────────────────────────── */}
                <section className="rp-sec page-break">
                    <h2>
                        4. Détail des factures <span>— {data.length} facture{data.length > 1 ? "s" : ""}</span>
                    </h2>
                    <table>
                        <thead>
                            <tr>
                                <th>Date</th>
                                <th>N° Facture</th>
                                <th>Patient</th>
                                <th>Mode</th>
                                <th className="num">Brut</th>
                                <th className="num">Remise</th>
                                <th className="num">Patient</th>
                                <th className="num">Assurance</th>
                                <th className="ctr">Statut</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="rp-empty">
                                        Aucune facture sur la période.
                                    </td>
                                </tr>
                            ) : (
                                data.map((r) => (
                                    <tr key={r.id}>
                                        <td className="rp-nowrap tnum">{format(new Date(r.createdAt), "dd/MM/yy HH:mm")}</td>
                                        <td className="rp-nowrap rp-strong">{r.invoiceNumber}</td>
                                        <td className="rp-nowrap">{`${r.patient.firstName} ${r.patient.lastName}`.trim()}</td>
                                        <td>{r.paymentMethod ? (METHOD_LABEL[r.paymentMethod] ?? r.paymentMethod) : "—"}</td>
                                        <td className="num tnum">{money2(r.totalAmount)}</td>
                                        <td className="num tnum">{Number(r.discountAmount) > 0 ? money2(r.discountAmount) : "—"}</td>
                                        <td className="num tnum">{money2(r.patientAmount)}</td>
                                        <td className="num tnum">{money2(r.insuranceAmount)}</td>
                                        <td className="ctr">{STATUS_LABEL[r.status] ?? r.status}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                        {data.length > 0 ? (
                            <tfoot>
                                <tr className="total">
                                    <td colSpan={4}>Total {data.length} facture{data.length > 1 ? "s" : ""}</td>
                                    <td className="num tnum">
                                        {money(data.reduce((a, r) => a + Number(r.totalAmount), 0))}
                                    </td>
                                    <td className="num tnum">
                                        {money(data.reduce((a, r) => a + Number(r.discountAmount), 0))}
                                    </td>
                                    <td className="num tnum">
                                        {money(data.reduce((a, r) => a + Number(r.patientAmount), 0))}
                                    </td>
                                    <td className="num tnum">
                                        {money(data.reduce((a, r) => a + Number(r.insuranceAmount), 0))}
                                    </td>
                                    <td />
                                </tr>
                            </tfoot>
                        ) : null}
                    </table>
                </section>

                {/* ── Signatures ─────────────────────────────────────────── */}
                <div className="rp-sign">
                    <div>
                        <div className="line">Établi par — Nom, qualité</div>
                    </div>
                    <div>
                        <div className="line">Approuvé par — Direction</div>
                    </div>
                </div>

                {/* ── Running footer ─────────────────────────────────────── */}
                <div className="rp-foot">
                    <span>
                        Clinique Médico-Dentaire Le Sourire — Rapport de facturation et de rentabilité
                    </span>
                    <span>
                        Période {safeDate(filters.startDate)} → {safeDate(filters.endDate)} · {serviceLabel} ·{" "}
                        Document confidentiel
                    </span>
                </div>
            </div>
        </div>
    )
}