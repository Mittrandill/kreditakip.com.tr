import { db } from "@/lib/db"
import { auth } from "@clerk/nextjs"
import { NextResponse } from "next/server"

export async function POST(req: Request, { params }: { params: { storeId: string } }) {
  try {
    const { userId } = auth()

    const body = await req.json()

    const { name, clientId, clientSecret } = body

    if (!userId) {
      return new NextResponse("Unauthenticated", { status: 403 })
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    if (!clientId) {
      return new NextResponse("Client ID is required", { status: 400 })
    }

    if (!clientSecret) {
      return new NextResponse("Client Secret is required", { status: 400 })
    }

    if (!params.storeId) {
      return new NextResponse("Store id is required", { status: 400 })
    }

    const bankingCredential = await db.bankingCredential.create({
      data: {
        name,
        clientId,
        clientSecret,
        storeId: params.storeId,
      },
    })

    return NextResponse.json(bankingCredential)
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 })
  }
}

export async function GET(req: Request, { params }: { params: { storeId: string } }) {
  try {
    if (!params.storeId) {
      return new NextResponse("Store id is required", { status: 400 })
    }

    const bankingCredentials = await db.bankingCredential.findMany({
      where: {
        storeId: params.storeId,
      },
    })

    return NextResponse.json(bankingCredentials)
  } catch (error) {
    return new NextResponse("Internal error", { status: 500 })
  }
}
