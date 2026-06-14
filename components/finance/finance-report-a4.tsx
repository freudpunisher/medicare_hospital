import React from "react"

interface FinanceData {
    summary: {
        totalRevenue: number
        totalCosts: number
        netBalance: number
        breakdown: {
            pharmacy: number
            medicalActs: number
            purchases: number
            expenses: number
        }
    }
    period: string
}

interface FinanceReportProps {
    data: FinanceData | null
    ref: React.RefObject<HTMLDivElement>
}

export const FinanceReportA4 = React.forwardRef<HTMLDivElement, { data: FinanceData | null }>(
    ({ data }, ref) => {
        if (!data) return null

        const periodLabels: Record<string, string> = {
            today: "Aujourd'hui",
            month: "Ce Mois",
            year: "Cette Année",
            all: "Tout Historique"
        }

        return (
            <div ref={ref} className="bg-white text-slate-800 p-[15mm] font-serif w-[210mm] min-h-[297mm] mx-auto shadow-none">
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-10">
                    <div className="space-y-1">
                        <h1 className="text-3xl font-black tracking-tighter text-slate-900 uppercase">Rapport Financier</h1>
                        <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">Medicare Health Information System</p>
                    </div>
                    <div className="text-right space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Période d'Audit</p>
                        <p className="text-base font-black uppercase text-slate-900 leading-none">{periodLabels[data.period] || data.period}</p>
                        <p className="text-[9px] font-bold text-slate-400 italic">Généré le {new Date().toLocaleString('fr-FR')}</p>
                    </div>
                </div>

                {/* Main KPIs Section */}
                <div className="grid grid-cols-3 gap-6 mb-12">
                    <div className="bg-slate-50 p-6 border-l-4 border-slate-900">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Revenus</p>
                        <p className="text-xl font-black text-slate-900">{data.summary.totalRevenue.toLocaleString()} <span className="text-[10px]">FBU</span></p>
                    </div>
                    <div className="bg-slate-50 p-6 border-l-4 border-slate-400">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Total Charges</p>
                        <p className="text-xl font-black text-slate-900">{data.summary.totalCosts.toLocaleString()} <span className="text-[10px]">FBU</span></p>
                    </div>
                    <div className="bg-slate-900 p-6 text-white shadow-xl">
                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-300 mb-2">Solde Net</p>
                        <p className="text-xl font-black whitespace-nowrap">{data.summary.netBalance.toLocaleString()} <span className="text-[10px]">FBU</span></p>
                    </div>
                </div>

                {/* Revenue Breakdown */}
                <div className="mb-10">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2 mb-4 flex justify-between">
                        <span>Détails des Recettes</span>
                        <span className="text-[10px] font-bold text-slate-400 italic">Revenue Centers</span>
                    </h2>
                    <table className="w-full text-[12px]">
                        <thead>
                            <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] tracking-widest">
                                <th className="py-3 px-4 text-left">Centre de Profit</th>
                                <th className="py-3 px-4 text-right">Montant (FBU)</th>
                                <th className="py-3 px-4 text-right w-24">Poids (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="py-4 px-4 font-bold text-slate-700">Pharmacie (Ventes Médicaments)</td>
                                <td className="py-4 px-4 text-right font-black text-slate-900">{data.summary.breakdown.pharmacy.toLocaleString()}</td>
                                <td className="py-4 px-4 text-right text-slate-400 italic">{((data.summary.breakdown.pharmacy / data.summary.totalRevenue) * 100).toFixed(1)}%</td>
                            </tr>
                            <tr>
                                <td className="py-4 px-4 font-bold text-slate-700">Actes Médicaux & Prestations</td>
                                <td className="py-4 px-4 text-right font-black text-slate-900">{data.summary.breakdown.medicalActs.toLocaleString()}</td>
                                <td className="py-4 px-4 text-right text-slate-400 italic">{((data.summary.breakdown.medicalActs / data.summary.totalRevenue) * 100).toFixed(1)}%</td>
                            </tr>
                            <tr className="bg-slate-50/50">
                                <td className="py-4 px-4 font-black uppercase text-[10px] text-slate-900">Total Recettes Brut</td>
                                <td className="py-4 px-4 text-right font-black text-slate-900 border-t-2 border-slate-900">{data.summary.totalRevenue.toLocaleString()}</td>
                                <td className="py-4 px-4 text-right font-black text-slate-900">100%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Expenditures Breakdown */}
                <div className="mb-12">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 border-b border-slate-200 pb-2 mb-4 flex justify-between">
                        <span>Détails des Dépenses</span>
                        <span className="text-[10px] font-bold text-slate-400 italic">Cost Centers</span>
                    </h2>
                    <table className="w-full text-[12px]">
                        <thead>
                            <tr className="bg-slate-50 text-slate-400 font-black uppercase text-[9px] tracking-widest">
                                <th className="py-3 px-4 text-left">Centre de Coût</th>
                                <th className="py-3 px-4 text-right">Montant (FBU)</th>
                                <th className="py-3 px-4 text-right w-24">Poids (%)</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            <tr>
                                <td className="py-4 px-4 font-bold text-slate-700">Approvisionnement Pharmacie (Achats)</td>
                                <td className="py-4 px-4 text-right font-black text-slate-900">{data.summary.breakdown.purchases.toLocaleString()}</td>
                                <td className="py-4 px-4 text-right text-slate-400 italic">{((data.summary.breakdown.purchases / data.summary.totalCosts) * 100).toFixed(1)}%</td>
                            </tr>
                            <tr>
                                <td className="py-4 px-4 font-bold text-slate-700">Frais Opérationnels & Divers</td>
                                <td className="py-4 px-4 text-right font-black text-slate-900">{data.summary.breakdown.expenses.toLocaleString()}</td>
                                <td className="py-4 px-4 text-right text-slate-400 italic">{((data.summary.breakdown.expenses / data.summary.totalCosts) * 100).toFixed(1)}%</td>
                            </tr>
                            <tr className="bg-slate-50/50">
                                <td className="py-4 px-4 font-black uppercase text-[10px] text-slate-900">Total Charges Opérationnelles</td>
                                <td className="py-4 px-4 text-right font-black text-slate-900 border-t-2 border-slate-900">{data.summary.totalCosts.toLocaleString()}</td>
                                <td className="py-4 px-4 text-right font-black text-slate-900">100%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Footer Signature */}
                <div className="mt-auto pt-20 grid grid-cols-2 gap-20">
                    <div className="text-center">
                        <div className="border-t border-slate-300 pt-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Directeur Financier</p>
                            <p className="text-[8px] text-slate-400 uppercase tracking-tighter mt-1">Sceau & Signature</p>
                        </div>
                    </div>
                    <div className="text-center">
                        <div className="border-t border-slate-300 pt-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Administrateur Général</p>
                            <p className="text-[8px] text-slate-400 uppercase tracking-tighter mt-1">Sceau & Signature</p>
                        </div>
                    </div>
                </div>

                <div className="mt-10 pt-4 border-t border-slate-100 text-center">
                    <p className="text-[8px] font-bold text-slate-300 uppercase tracking-[0.3em]">Confidential Hospital Data • Audited System Generation</p>
                </div>
            </div>
        )
    }
)

FinanceReportA4.displayName = "FinanceReportA4"
