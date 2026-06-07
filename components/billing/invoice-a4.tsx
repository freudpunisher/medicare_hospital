import React from 'react'
import { format } from 'date-fns'
import { fr } from 'date-fns/locale'

interface InvoiceA4Props {
    invoice: any
}

export const InvoiceA4 = React.forwardRef<HTMLDivElement, InvoiceA4Props>(({ invoice }, ref) => {
    if (!invoice) return null

    return (
        <div
            ref={ref}
            className="bg-white p-12 text-slate-900 font-serif"
            style={{
                width: '210mm',
                minHeight: '297mm',
                margin: '0 auto',
                boxSizing: 'border-box',
                fontSize: '12pt'
            }}
        >
            {/* Header */}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-8 mb-8">
                <div className="flex items-start gap-4">
                    <img src="/images/logo.png" alt="Logo" className="size-20 object-contain" />
                    <div>
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 leading-none">CLINIQUE MEDICO-DENTAIRE</h1>
                        <p className="mt-2 text-sm font-bold uppercase text-slate-600">Service de Santé d'Excellence</p>
                        <div className="mt-4 text-[10px] leading-relaxed text-slate-500 font-sans max-w-xs">
                            <p>Africana House (en face de la permanence nationale du CNDD-FDD)</p>
                            <p>Kigobe, Boulevard Mwambutsa, Bujumbura</p>
                            <p>Contact: +257 22 22 00 00 | contact@medico-dentaire.bi</p>
                            <p className="mt-2 pt-2 border-t border-slate-200">
                                Forme juridique: SURL | RC: 00734372/25
                            </p>
                            <p>Centre fiscal: DPMC</p>
                        </div>
                    </div>
                </div>
                <div className="text-right">
                    <h2 className="text-4xl font-black text-slate-200 uppercase tracking-widest leading-none mb-4">FACTURE</h2>
                    <div className="space-y-1 text-sm font-sans">
                        <p><span className="font-bold">Facture No:</span> {invoice.invoiceNumber}</p>
                        <p><span className="font-bold">Date:</span> {format(new Date(invoice.createdAt), 'dd MMMM yyyy', { locale: fr })}</p>
                    </div>
                </div>
            </div>

            {/* Patient & Billing Info */}
            <div className="grid grid-cols-2 gap-12 mb-12 font-sans">
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 underline underline-offset-4">Patient</h3>
                    <p className="text-lg font-bold text-slate-900 uppercase">{invoice.patient.firstName} {invoice.patient.lastName}</p>
                    <p className="text-sm text-slate-600">Genre: {invoice.patient.gender === 'male' ? 'Homme' : 'Femme'}</p>
                    <p className="text-sm text-slate-600">ID Patient: #{invoice.patient.patientNumber}</p>
                </div>
                <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-2 underline underline-offset-4">Détails Assurance</h3>
                    {invoice.insuranceAmount && Number(invoice.insuranceAmount) > 0 ? (
                        <div className="space-y-1">
                            <p className="text-sm font-bold text-slate-900 uppercase">Couverture Active</p>
                            <p className="text-xs text-slate-500 italic">Bordereau en attente de traitement</p>
                        </div>
                    ) : (
                        <p className="text-sm text-slate-500 italic font-medium">Paiement Direct (Privé)</p>
                    )}
                </div>
            </div>

            {/* Table */}
            <table className="w-full border-collapse mb-12 font-sans">
                <thead>
                    <tr className="bg-slate-100">
                        <th className="border-y border-slate-900 text-left py-3 px-4 text-xs font-black uppercase tracking-wider">Description de l'Acte</th>
                        <th className="border-y border-slate-900 text-center py-3 px-4 text-xs font-black uppercase tracking-wider">Quantité</th>
                        <th className="border-y border-slate-900 text-right py-3 px-4 text-xs font-black uppercase tracking-wider">Montant (FBU)</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Note: Items need to be passed in or fetched. Assuming they are in the invoice object */}
                    {invoice.items && invoice.items.length > 0 ? (
                        invoice.items.map((item: any, idx: number) => (
                            <tr key={idx} className="border-b border-slate-100 italic">
                                <td className="py-4 px-4 text-sm font-medium">{item.actName || 'Service Médical'}</td>
                                <td className="py-4 px-4 text-sm text-center">1</td>
                                <td className="py-4 px-4 text-sm font-bold text-right">{(item.totalPrice || item.price || 0).toLocaleString()}</td>
                            </tr>
                        ))
                    ) : (
                        <tr className="border-b border-slate-100">
                            <td className="py-4 px-4 text-sm font-medium">Prestations Médicales Globales</td>
                            <td className="py-4 px-4 text-sm text-center">1</td>
                            <td className="py-4 px-4 text-sm font-bold text-right">{Number(invoice.totalAmount).toLocaleString()}</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Footer Totals */}
            <div className="flex justify-end font-sans">
                <div className="w-80 space-y-3">
                    <div className="flex justify-between text-sm py-1 border-b border-slate-100">
                        <span className="font-bold text-slate-500 uppercase tracking-tighter">Montant Brut</span>
                        <span className="font-bold">{Number(invoice.totalAmount).toLocaleString()} FBU</span>
                    </div>
                    <div className="flex justify-between text-sm py-1 border-b border-slate-100 text-slate-600">
                        <span className="font-bold uppercase tracking-tighter italic">Prise en charge Assurance</span>
                        <span className="font-bold">-{Number(invoice.insuranceAmount).toLocaleString()} FBU</span>
                    </div>
                    <div className="flex justify-between text-lg py-3 bg-slate-900 text-white px-4 rounded-lg">
                        <span className="font-black uppercase tracking-widest">Net à Payer</span>
                        <span className="font-black">{Number(invoice.patientAmount).toLocaleString()} FBU</span>
                    </div>
                </div>
            </div>

            {/* Signature Area */}
            <div className="mt-24 grid grid-cols-2 gap-12 font-sans pt-12">
                <div className="text-center">
                    <div className="border-t border-slate-300 pt-3">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-12">Cachet & Signature Hôpital</p>
                    </div>
                </div>
                <div className="text-center">
                    <div className="border-t border-slate-300 pt-3">
                        <p className="text-[10px] font-black uppercase text-slate-400 mb-12">Signature du Patient / Tuteur</p>
                    </div>
                </div>
            </div>

            {/* Bottom Legal */}
            <div className="absolute bottom-12 left-12 right-12 text-[8px] text-slate-400 font-sans border-t pt-2 flex justify-between uppercase tracking-[0.2em] font-black italic">
                <span>Medicare Hospital Information System 2026</span>
                <span>Logiciel certifié compliant</span>
            </div>
        </div>
    )
})

InvoiceA4.displayName = 'InvoiceA4'
