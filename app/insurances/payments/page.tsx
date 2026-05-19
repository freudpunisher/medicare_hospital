import Link from 'next/link'
import { db } from '@/db'
import { insurancePayments, insuranceClaims, insurances } from '@/db/schema'
import { eq } from 'drizzle-orm'

export default async function InsurancePaymentsPage() {
  const items = await db
    .select({
      id: insurancePayments.id,
      amount: insurancePayments.amount,
      paymentDate: insurancePayments.paymentDate,
      referenceNumber: insurancePayments.referenceNumber,
      insuranceName: insurances.name,
      claimId: insuranceClaims.id,
      claimStatus: insuranceClaims.status,
    })
    .from(insurancePayments)
    .leftJoin(insurances, eq(insurancePayments.insuranceId, insurances.id))
    .leftJoin(insuranceClaims, eq(insurancePayments.claimId, insuranceClaims.id))
    .orderBy(insurancePayments.paymentDate)

  return (
    <main className="p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Insurance Payments</h1>
          <p className="text-sm text-slate-500">Record payments received from insurance</p>
        </div>
        <Link href="/insurances/claims" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
          Go to Insurance Claims
        </Link>
      </div>

      <div className="overflow-x-auto bg-white rounded-lg border shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-100 text-sm uppercase text-slate-600">
            <tr>
              <th className="p-3">Insurance</th>
              <th className="p-3">Claim</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Date</th>
              <th className="p-3">Reference</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} className="border-t">
                <td className="p-3">{item.insuranceName || 'Unknown'}</td>
                <td className="p-3">{item.claimId} / {item.claimStatus}</td>
                <td className="p-3">{Number(item.amount).toFixed(2)}</td>
                <td className="p-3">{new Date(item.paymentDate).toLocaleDateString()}</td>
                <td className="p-3">{item.referenceNumber || '-'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  )
}