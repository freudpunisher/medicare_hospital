import Link from 'next/link'
import { db } from '@/db'
import { insurances } from '@/db/schema'

export default async function InsurancesPage() {
  const items = await db.select().from(insurances).orderBy(insurances.name)

  const active = items.filter((x) => x.isActive).length
  const inactive = items.length - active

  return (
    <main className="p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Insurances</h1>
          <p className="text-sm text-slate-500">Claim and payment tracking for insurance partners</p>
        </div>
        <div className="flex gap-2">
          <Link href="/insurances/claims" className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            Insurance Claims
          </Link>
          <Link href="/insurances/payments" className="rounded-md bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700">
            Insurance Payments
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        <article className="rounded-lg border p-4 bg-white shadow-sm">
          <h2 className="text-xl font-semibold">Total insurers</h2>
          <p className="mt-2 text-4xl font-bold">{items.length}</p>
        </article>
        <article className="rounded-lg border p-4 bg-white shadow-sm">
          <h2 className="text-xl font-semibold">Active</h2>
          <p className="mt-2 text-4xl font-bold text-green-600">{active}</p>
        </article>
        <article className="rounded-lg border p-4 bg-white shadow-sm">
          <h2 className="text-xl font-semibold">Inactive</h2>
          <p className="mt-2 text-4xl font-bold text-red-600">{inactive}</p>
        </article>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => (
          <article key={item.id} className="rounded-lg border p-4 shadow-sm hover:shadow-md transition">
            <h3 className="text-lg font-semibold">{item.name}</h3>
            <p className="text-sm text-slate-600">{item.contactInfo || 'No contact info'}</p>
            <p className="mt-2 text-xs text-slate-500">Status: {item.isActive ? 'Active' : 'Inactive'}</p>
            <p className="text-xs text-slate-500">Created on {new Date(item.createdAt).toLocaleDateString()}</p>
            <Link href={`/insurances/${item.id}`} className="inline-block mt-3 text-blue-600 hover:text-blue-700 text-sm">
              View details
            </Link>
          </article>
        ))}
      </div>
    </main>
  )
}
