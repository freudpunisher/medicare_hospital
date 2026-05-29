import React from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface BordereauA4Props {
    claims: any[]
}

export const BordereauA4 = React.forwardRef<HTMLDivElement, BordereauA4Props>(({ claims }, ref) => {
    if (!claims || claims.length === 0) return null

    const totalClaimed = claims.reduce((sum, c) => sum + Number(c.claimAmount), 0)
    const totalApproved = claims.reduce((sum, c) => sum + Number(c.approvedAmount), 0)

    return (
        <div
            ref={ref}
            className="bg-white p-12 text-slate-900 font-sans"
            style={{
                width: '210mm',
                minHeight: '297mm',
                margin: '0 auto',
                boxSizing: 'border-box',
                fontSize: '10pt'
            }}
        >
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6 mb-8">
                <div className="flex items-start gap-4">
                    <img src="/images/logo.png" alt="Logo" className="size-16 object-contain" />
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter text-slate-900 leading-none">CLINIQUE MEDICO-DENTAIRE</h1>
                        <p className="mt-1 text-[10px] font-bold uppercase text-slate-500">Département de Facturation & Assurances</p>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-black text-slate-900 uppercase tracking-widest leading-none mb-2">BORDEREAU GLOBAL</h2>
                    <p className="text-xs font-bold text-slate-500">Généré le: {format(new Date(), 'dd/MM/yyyy HH:mm')}</p>
                </div>
            </div>

            <div className="mb-8">
                <p className="text-sm font-medium">Le présent bordereau récapitule l'ensemble des prestations médicales soumises pour règlement.</p>
            </div>

            {/* Table */}
            <table className="w-full border-collapse mb-12">
                <thead>
                    <tr className="bg-slate-100">
                        <th className="border border-slate-300 py-2 px-3 text-[9px] font-black uppercase text-left">Date</th>
                        <th className="border border-slate-300 py-2 px-3 text-[9px] font-black uppercase text-left">Facture</th>
                        <th className="border border-slate-300 py-2 px-3 text-[9px] font-black uppercase text-left">Patient</th>
                        <th className="border border-slate-300 py-2 px-3 text-[9px] font-black uppercase text-left">Assurance</th>
                        <th className="border border-slate-300 py-2 px-3 text-[9px] font-black uppercase text-right">Montant Réclamé</th>
                        <th className="border border-slate-300 py-2 px-3 text-[9px] font-black uppercase text-center">Statut</th>
                    </tr>
                </thead>
                <tbody>
                    {claims.map((claim, idx) => (
                        <tr key={idx} className="border-b border-slate-200">
                            <td className="border border-slate-300 py-2 px-3 text-[9px]">{format(new Date(claim.createdAt), 'dd/MM/yy')}</td>
                            <td className="border border-slate-300 py-2 px-3 text-[9px] font-bold">{claim.invoice.invoiceNumber}</td>
                            <td className="border border-slate-300 py-2 px-3 text-[9px] uppercase font-medium">{claim.patient.firstName} {claim.patient.lastName}</td>
                            <td className="border border-slate-300 py-2 px-3 text-[9px] uppercase">{claim.insurance.name}</td>
                            <td className="border border-slate-300 py-2 px-3 text-[9px] font-bold text-right">{Number(claim.claimAmount).toLocaleString()}</td>
                            <td className="border border-slate-300 py-2 px-3 text-[8px] text-center uppercase font-black">{claim.status}</td>
                        </tr>
                    ))}
                </tbody>
                <tfoot>
                    <tr className="bg-slate-50 font-black">
                        <td colSpan={4} className="border border-slate-300 py-3 px-3 text-right text-xs uppercase">TOTAL GÉNÉRAL RÉCLAMÉ</td>
                        <td className="border border-slate-300 py-3 px-3 text-right text-xs underline underline-offset-4 decoration-2">{totalClaimed.toLocaleString()} FBU</td>
                        <td className="border border-slate-300 py-3 px-3"></td>
                    </tr>
                </tfoot>
            </table>

            {/* Summary Section */}
            <div className="grid grid-cols-2 gap-12 mt-12">
                <div className="border p-6 rounded-xl bg-slate-50">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4 border-b pb-2">Récapitulatif Financier</h3>
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-500 uppercase">Nombre d'Actes:</span>
                            <span className="font-black">{claims.length}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                            <span className="font-bold text-slate-500 uppercase">Total Réclamé:</span>
                            <span className="font-black underline">{totalClaimed.toLocaleString()} FBU</span>
                        </div>
                        <div className="flex justify-between text-xs text-success font-black">
                            <span className="uppercase">Déjà Approuvé:</span>
                            <span>{totalApproved.toLocaleString()} FBU</span>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col justify-end text-center">
                    <div className="border-t border-slate-300 pt-3">
                        <p className="text-[9px] font-black uppercase text-slate-400 mb-16">Cachet & Signature Direction</p>
                        <div className="h-20 italic text-slate-300 flex items-center justify-center border border-dashed rounded-lg opacity-20">Emplacement Cachet</div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-12 left-12 right-12 text-[8px] text-slate-400 border-t pt-2 flex justify-between uppercase tracking-[0.1em] font-black">
                <span>Medicare Hospital - Administration Billing</span>
                <span>Logiciel HIS - Burundi Medical Standard</span>
            </div>
        </div>
    )
})

BordereauA4.displayName = 'BordereauA4'
