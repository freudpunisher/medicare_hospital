import Link from 'next/link'
import { db } from '@/db'
import { insuranceClaims, insurances, patients, invoices } from '@/db/schema'
import { eq } from 'drizzle-orm'

export default async function InsuranceClaimsPage() {
  const items = await db
    .select({
      id: insuranceClaims.id,
      status: insuranceClaims.status,
      claimAmount: insuranceClaims.claimAmount,
      approvedAmount: insuranceClaims.approvedAmount,
      submittedAt: insuranceClaims.submittedAt,
      paidAt: insuranceClaims.paidAt,
      insuranceName: insurances.name,
      patientFirstName: patients.firstName,
      patientLastName: patients.lastName,
      invoiceNumber: invoices.invoiceNumber,
    })
    .from(insuranceClaims)
    .leftJoin(insurances, eq(insuranceClaims.insuranceId, insurances.id))
    .leftJoin(patients, eq(insuranceClaims.patientId, patients.id))
    .leftJoin(invoices, eq(insuranceClaims.invoiceId, invoices.id))
    .orderBy(insuranceClaims.submittedAt)

  return (
    <main className="p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Insurance Claims</h1>
          <p className="text-sm text-slate-500">Track claims sent to insurers</p>
        </div>
        <Link href="/insurances/payments" className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
          Go to Insurance Payments
        </Link>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-sm uppercase text-slate-600">
            <tr>
              <th className="p-3">Insurance</th>
              <th className="p-3">Patient</th>
              <th className="p-3">Invoice</th>
              <th className="p-3">Claim</th>
              <th className="p-3">Approved</th>
              <th className="p-3">Status</th>
              <th className="p-3">Submitted</th>
              <th className="p-3">Paid</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3">{item.insuranceName || 'Unknown'}</td>
                <td className="p-3">{item.patientFirstName} {item.patientLastName}</td>
                <td className="p-3">{item.invoiceNumber}</td>
                <td className="p-3">{Number(item.claimAmount).toFixed(2)}</td>
                <td className="p-3">{Number(item.approvedAmount).toFixed(2)}</td>
                <td className={`p-3 font-semibold ${item.status === 'approved' ? 'text-green-700' : item.status === 'rejected' ? 'text-red-700' : 'text-amber-700'}`}>
                  {item.status}
                </td>
                <td className="p-3">{new Date(item.submittedAt).toLocaleDateString()}</td>
                <td className="p-3">{item.paidAt ? new Date(item.paidAt).toLocaleDateString() : '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}