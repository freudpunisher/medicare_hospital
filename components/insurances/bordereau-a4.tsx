import React from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface BordereauA4Props {
    batch: any
}

export const BordereauA4 = React.forwardRef<HTMLDivElement, BordereauA4Props>(({ batch }, ref) => {
    if (!batch) return null

    const totalAmount = parseFloat(batch.totalAmount)

    return (
        <div
            ref={ref}
            className="bg-white p-12 text-slate-900 font-serif"
            style={{
                width: '210mm',
                minHeight: '297mm',
                margin: '0 auto',
                boxSizing: 'border-box',
                fontSize: '11pt',
                position: 'relative'
            }}
        >
            {/* Header / Letterhead */}
            <div className="flex justify-between items-start border-b-4 border-double border-slate-900 pb-6 mb-8">
                <div className="flex items-start gap-4">
                    <div className="size-16 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-2xl">S</div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">CLINIQUE MEDICO-DENTAIRE</h1>
                        <h2 className="text-xl font-bold uppercase text-slate-700 mt-1 italic">Le SOURIRE</h2>
                        <div className="mt-4 text-[9px] leading-tight text-slate-500 font-sans max-w-sm">
                            <p className="font-bold">AFRICANA HOUSE / KIGOBE, BOULEVARD MWAMBUTSA</p>
                            <p>BUJUMBURA, BURUNDI</p>
                            <p>Tél: +257 22 22 00 00 | Email: contact@le-sourire.bi</p>
                            <p className="mt-1">NIF: 500253456 | RC: 00734372/25 | FISCAL: DPMC</p>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <div className="bg-slate-100 px-4 py-2 rounded-lg inline-block border border-slate-200">
                        <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em]">Bordereau Réclamation</h2>
                        <p className="text-xl font-black text-slate-900 mt-1">{batch.batchNumber}</p>
                    </div>
                    <div className="mt-4 text-sm font-sans">
                        <p><span className="font-bold">Date de Génération:</span> {format(new Date(batch.createdAt), 'dd/MM/yyyy')}</p>
                        <p><span className="font-bold">Status:</span> <span className="uppercase">{batch.status === 'paid' ? 'Acquitté' : 'En Attente'}</span></p>
                    </div>
                </div>
            </div>

            {/* Institutional Header */}
            <div className="bg-slate-900 text-white p-6 rounded-2xl mb-8 flex justify-between items-center font-sans shadow-xl">
                <div>
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Compagnie d'Assurance</h3>
                    <p className="text-2xl font-black uppercase tracking-tight">{batch.insurance?.name || 'ASSUREUR INCONNU'}</p>
                </div>
                <div className="text-right">
                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Montant Global de Réclamation</h3>
                    <p className="text-3xl font-black tracking-tight">{totalAmount.toLocaleString()} <span className="text-sm font-normal">FBU</span></p>
                </div>
            </div>

            {/* Summary Info */}
            <div className="grid grid-cols-3 gap-6 mb-8 font-sans">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Nombre de Dossiers</p>
                    <p className="text-lg font-bold text-slate-900 underline underline-offset-4 decoration-slate-300">{batch.claims?.length || 0} Factures Patients</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Période de Facturation</p>
                    <p className="text-lg font-bold text-slate-900">Mois de {format(new Date(batch.createdAt), 'MMMM yyyy', { locale: fr })}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Référence Bordereau</p>
                    <p className="text-lg font-bold text-slate-900 font-mono">RECL-{batch.batchNumber.split('-')[1]}</p>
                </div>
            </div>

            {/* Main Table */}
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-4 px-1">Récapitulatif Détaillé des Prestations</p>
            <table className="w-full border-collapse mb-12 font-sans border border-slate-200">
                <thead className="bg-slate-100">
                    <tr>
                        <th className="border border-slate-200 text-left py-3 px-2 text-[9px] font-black uppercase tracking-wider w-8 text-center">No</th>
                        <th className="border border-slate-200 text-left py-3 px-4 text-[9px] font-black uppercase tracking-wider w-[180px]">Identité & Assurance</th>
                        <th className="border border-slate-200 text-left py-3 px-4 text-[9px] font-black uppercase tracking-wider">Acte / Prestation Médicale</th>
                        <th className="border border-slate-200 text-center py-3 px-2 text-[9px] font-black uppercase tracking-wider w-16">Taux</th>
                        <th className="border border-slate-200 text-right py-3 px-2 text-[9px] font-black uppercase tracking-wider w-24">Patient</th>
                        <th className="border border-slate-200 text-right py-3 px-2 text-[9px] font-black uppercase tracking-wider w-24">Assurance</th>
                    </tr>
                </thead>
                <tbody>
                    {batch.claims && batch.claims.length > 0 ? (
                        batch.claims.map((claim: any, idx: number) => {
                            // Robust patient name resolution
                            const patientName = claim.patient?.firstName ?
                                `${claim.patient.firstName} ${claim.patient.lastName}` :
                                (claim.invoice?.patient?.firstName ? `${claim.invoice.patient.firstName} ${claim.invoice.patient.lastName}` : "Patient Inconnu");

                            const patientNumber = claim.patient?.patientNumber || claim.invoice?.patient?.patientNumber || "N/A";

                            // Find the patient insurance record that matches the batch's insurance provider
                            const pInsurance = claim.patient?.insurances?.find((pi: any) => pi.insuranceId === batch.insuranceId) ||
                                claim.invoice?.patient?.insurances?.find((pi: any) => pi.insuranceId === batch.insuranceId)

                            const coverageRate = pInsurance?.coverageRate ? `${parseFloat(pInsurance.coverageRate)}%` : "N/A";
                            const patientAmount = parseInt(claim.invoice?.patientAmount || '0');
                            const insuranceAmount = parseInt(claim.invoice?.insuranceAmount || claim.claimAmount || '0');

                            const items = claim.invoice?.items || []
                            const rowCount = items.length || 1

                            return (
                                <React.Fragment key={claim.id}>
                                    {items.length > 0 ? (
                                        items.map((item: any, itemIdx: number) => {
                                            const itemTotalPrice = parseInt(item.totalPrice || '0')
                                            const coverageVal = pInsurance?.coverageRate ? parseFloat(pInsurance.coverageRate) : 100
                                            const itemInsuranceAmount = (itemTotalPrice * coverageVal) / 100
                                            const itemPatientAmount = itemTotalPrice - itemInsuranceAmount

                                            return (
                                                <tr key={item.id} className="border border-slate-200 bg-white page-break-inside-avoid">
                                                    {itemIdx === 0 && (
                                                        <>
                                                            <td rowSpan={rowCount} className="border border-slate-200 py-3 px-2 text-[10px] font-bold text-center text-slate-400 font-mono">
                                                                {idx + 1}
                                                            </td>
                                                            <td rowSpan={rowCount} className="border border-slate-200 py-3 px-4 align-top">
                                                                <div className="flex flex-col gap-1.5 min-w-[160px]">
                                                                    <span className="text-[11px] font-black uppercase text-slate-900 leading-tight">
                                                                        {patientName}
                                                                    </span>
                                                                    <div className="flex flex-col gap-0.5 border-l-2 border-slate-200 pl-2 mt-1">
                                                                        <p className="text-[8px] font-black text-primary uppercase italic">
                                                                            Fact: {claim.invoice?.invoiceNumber}
                                                                        </p>
                                                                        {pInsurance && (
                                                                            <>
                                                                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter leading-none">
                                                                                    Card: <span className="text-slate-900 font-black">{pInsurance.insuranceCardNumber || 'N/A'}</span>
                                                                                </p>
                                                                                <p className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter leading-none">
                                                                                    Pol: <span className="text-slate-900 font-black">{pInsurance.insuranceNumber || 'N/A'}</span>
                                                                                </p>
                                                                            </>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </td>
                                                        </>
                                                    )}
                                                    <td className="border border-slate-200 py-3 px-4 text-[10px] text-slate-600 font-medium">
                                                        <div className="flex justify-between items-center">
                                                            <span>• {item.medicalAct?.name || 'Prestation'}</span>
                                                            <span className="text-[8px] opacity-40 italic">({item.quantity} qté)</span>
                                                        </div>
                                                    </td>
                                                    <td className="border border-slate-200 py-3 px-2 text-[10px] text-center text-slate-400">
                                                        {coverageVal}%
                                                    </td>
                                                    <td className="border border-slate-200 py-3 px-2 text-[11px] font-bold text-right text-slate-500 italic">
                                                        {itemPatientAmount.toLocaleString()}
                                                    </td>
                                                    <td className="border border-slate-200 py-3 px-2 text-[12px] font-black text-right text-slate-950">
                                                        {itemInsuranceAmount.toLocaleString()}
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    ) : (
                                        <tr className="border border-slate-200 bg-white">
                                            <td className="border border-slate-200 py-3 px-2 text-[10px] font-bold text-center text-slate-400 font-mono italic">
                                                {idx + 1}
                                            </td>
                                            <td className="border border-slate-200 py-3 px-4 align-top">
                                                <div className="flex flex-col gap-1">
                                                    <span className="text-[11px] font-black uppercase text-slate-900">{patientName}</span>
                                                    <p className="text-[8px] font-black text-primary">Fact: {claim.invoice?.invoiceNumber}</p>
                                                </div>
                                            </td>
                                            <td className="border border-slate-200 py-3 px-4 text-[10px] text-slate-400 italic">Aucun acte répertorié</td>
                                            <td className="border border-slate-200 py-3 px-2 text-center text-slate-400">0%</td>
                                            <td className="border border-slate-200 py-3 px-2 text-right text-slate-400">0</td>
                                            <td className="border border-slate-200 py-3 px-2 text-right text-slate-900 font-black">{parseInt(claim.claimAmount).toLocaleString()}</td>
                                        </tr>
                                    )}
                                    <tr className="h-1 bg-slate-50 border-x border-slate-200">
                                        <td colSpan={6}></td>
                                    </tr>
                                </React.Fragment>
                            )
                        })
                    ) : (
                        <tr>
                            <td colSpan={5} className="py-20 text-center text-slate-400 italic">Aucun détail disponible pour ce bordereau.</td>
                        </tr>
                    )}
                    {/* Total Row */}
                    <tr className="bg-slate-900 text-white page-break-inside-avoid border border-slate-900">
                        <td colSpan={5} className="py-4 px-8 text-right text-[10px] font-black uppercase tracking-[0.3em] bg-slate-800">TOTAL GÉNÉRAL RÉCLAMÉ (PART ASSURANCE FBU)</td>
                        <td className="py-4 px-4 text-right text-xl font-black">{totalAmount.toLocaleString()}</td>
                    </tr>
                </tbody>
            </table>

            {/* Certifications & Footer */}
            <div className="grid grid-cols-2 gap-12 mt-20 font-sans pt-12 page-break-inside-avoid border-t-2 border-slate-900/10">
                <div className="text-center px-8 border-r border-slate-100">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-20 italic">Direction de la Clinique</p>
                    <div className="border-t-2 border-slate-900 w-full"></div>
                    <p className="text-[8px] mt-2 text-slate-400 uppercase tracking-widest font-black italic">Cachet & Signature</p>
                </div>
                <div className="text-center px-8">
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 mb-20 italic">Validation Assurance</p>
                    <div className="border-t-2 border-slate-900 w-full"></div>
                    <p className="text-[8px] mt-2 text-slate-400 uppercase tracking-widest font-black italic">Visa Autorisé</p>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    @page {
                        size: A4 portrait;
                        margin: 15mm;
                    }
                    body {
                        margin: 0;
                        padding: 0;
                        background: white;
                    }
                    .page-break-inside-avoid {
                        page-break-inside: avoid;
                    }
                    table {
                        page-break-inside: auto;
                    }
                    tr {
                        page-break-inside: avoid;
                        page-break-after: auto;
                    }
                }
            `}</style>

            {/* Bottom Info Panels */}
            <div className="mt-20 flex gap-4 text-slate-400 font-sans italic p-6 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 page-break-inside-avoid">
                <div className="size-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
                    <span className="text-xs font-black text-slate-600 NOT-italic leading-none">!</span>
                </div>
                <p className="text-[10px] leading-relaxed font-medium">
                    Ce bordereau institutionnel est un document de facturation auditable. Toute anomalie constatée doit être signalée dans un délai de 48 heures suivant la soumission. Logiciel de gestion MEDICARE HIS 2026.
                </p>
            </div>

            {/* Footer Watermark */}
            <div className="absolute bottom-12 left-12 right-12 text-[7px] text-slate-300 font-sans flex justify-between uppercase tracking-[0.5em] font-black italic border-t pt-2">
                <span>MEDICARE HIS - INSTITUTIONAL RECLAMATION MODULE - V1.4</span>
                <span>SECURED AUDIT TRAIL</span>
            </div>
        </div>
    )
})

BordereauA4.displayName = 'BordereauA4'
