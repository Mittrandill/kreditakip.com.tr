import { db } from "@/lib/db"
import { auth } from "@clerk/nextjs"
import { NextResponse } from "next/server"

export async function POST(req: Request, { params }: { params: { storeId: string } }) {
  try {
    const { userId } = auth()

    const body = await req.json()

    const { cardNumber, expiryDate, cvc } = body

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 403 })
    }

    if (!cardNumber) {
      return new NextResponse("Card number is required", { status: 400 })
    }

    if (!expiryDate) {
      return new NextResponse("Expiry date is required", { status: 400 })
    }

    if (!cvc) {
      return new NextResponse("CVC is required", { status: 400 })
    }

    if (!params.storeId) {
      return new NextResponse("Store id is required", { status: 400 })
    }

    const creditCard = await db.creditCard.create({
      data: {
        cardNumber,
        expiryDate,
        cvc,
        storeId: params.storeId,
      },
    })

    return NextResponse.json(creditCard)
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(req: Request, { params }: { params: { storeId: string } }) {
  try {
    if (!params.storeId) {
      return new NextResponse("Store id is required", { status: 400 })
    }

    const creditCards = await db.creditCard.findMany({
      where: {
        storeId: params.storeId,
      },
    })

    return NextResponse.json(creditCards)
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 })
  }
}
