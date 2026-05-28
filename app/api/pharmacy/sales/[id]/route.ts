import { NextResponse } from "next/server"
import { db } from "@/db"
import { pharmacySales, pharmacySaleItems, medicines, medicineLots } from "@/db/schema"
import { eq } from "drizzle-orm"

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id: saleId } = await params

        const sale = await db.query.pharmacySales.findFirst({
            where: eq(pharmacySales.id, saleId),
            with: {
                items: {
                    with: {
                        medicine: true,
                        lot: true,
                    }
                }
            }
        })

        if (!sale) {
            return NextResponse.json({ error: "Sale not found" }, { status: 404 })
        }

        return NextResponse.json({ data: sale })
    } catch (error) {
        console.error("Failed to fetch sale details:", error)
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
    }
}
