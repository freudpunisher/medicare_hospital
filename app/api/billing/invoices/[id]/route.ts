import { NextResponse } from 'next/server'
import { db } from '@/db'
import { invoices, invoiceItems, medicalActs, payments } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: invoiceId } = await params

        const invoice = await db.query.invoices.findFirst({
            where: eq(invoices.id, invoiceId),
            with: {
                patient: true,
            }
        })

        if (!invoice) {
            return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 })
        }

        const items = await db.select({
            id: invoiceItems.id,
            quantity: invoiceItems.quantity,
            unitPrice: invoiceItems.unitPrice,
            totalPrice: invoiceItems.totalPrice,
            medicalAct: {
                code: medicalActs.code,
                name: medicalActs.name,
            }
        })
            .from(invoiceItems)
            .innerJoin(medicalActs, eq(invoiceItems.medicalActId, medicalActs.id))
            .where(eq(invoiceItems.invoiceId, invoiceId))

        return NextResponse.json({
            success: true,
            data: {
                ...invoice,
                items
            }
        })
    } catch (error) {
        console.error('Failed to fetch invoice details:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: invoiceId } = await params
    const body = await req.json()
    const { status, cancellationReason } = body

    if (!status) {
      return NextResponse.json({ success: false, error: 'Status is required' }, { status: 400 })
    }

    const invoice = await db.query.invoices.findFirst({ where: eq(invoices.id, invoiceId) })
    if (!invoice) {
      return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 })
    }

    const [updated] = await db.transaction(async (tx) => {
      if (status === 'cancelled') {
        await tx.delete(payments).where(eq(payments.invoiceId, invoiceId))
      }

      const notes = cancellationReason
        ? `Annulation: ${cancellationReason}`
        : (invoice.status === 'paid' ? 'Annulation avec remboursement' : undefined)

      const updateData: any = { status, updatedAt: new Date() }
      if (notes) updateData.notes = notes

      return await tx
        .update(invoices)
        .set(updateData)
        .where(eq(invoices.id, invoiceId))
        .returning()
    })

    return NextResponse.json({ success: true, data: updated[0] })
  } catch (error) {
    console.error('Failed to update invoice:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: invoiceId } = await params
        const body = await req.json()
        const { paymentMethod, paymentReference, amount, cashSessionId } = body

        if (!paymentMethod) {
            return NextResponse.json({ success: false, error: 'Payment method is required' }, { status: 400 })
        }

        const invoice = await db.query.invoices.findFirst({
            where: eq(invoices.id, invoiceId),
        })

        if (!invoice) {
            return NextResponse.json({ success: false, error: 'Invoice not found' }, { status: 404 })
        }

        if (invoice.status === 'paid') {
            return NextResponse.json({ success: false, error: 'Invoice is already paid' }, { status: 400 })
        }

        const result = await db.transaction(async (tx) => {
            await tx.insert(payments).values({
                invoiceId,
                patientId: invoice.patientId,
                amount: (amount ?? invoice.patientAmount).toString(),
                paymentMethod,
                referenceNumber: paymentReference || null,
                cashSessionId: cashSessionId || null,
                notes: 'Payment recorded from invoice details',
            })

            const [updated] = await tx
                .update(invoices)
                .set({ status: 'paid', updatedAt: new Date() })
                .where(eq(invoices.id, invoiceId))
                .returning()

            return updated
        })

        return NextResponse.json({ success: true, data: result })
    } catch (error) {
        console.error('Failed to record payment:', error)
        return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
    }
}
