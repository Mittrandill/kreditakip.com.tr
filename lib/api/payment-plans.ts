// lib/api/payment-plans.ts

import { db } from "@/lib/db"
import { auth } from "@clerk/nextjs"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: { paymentPlanId: string } }) {
  try {
    if (!params.paymentPlanId) {
      return new NextResponse("Payment Plan ID is required", { status: 400 })
    }

    const { userId } = auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const paymentPlan = await db.paymentPlan.findUnique({
      where: {
        id: params.paymentPlanId,
        userId,
      },
      include: {
        paymentPlanItems: true,
      },
    })

    return NextResponse.json(paymentPlan)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = auth()
    const { name } = await req.json()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    const paymentPlan = await db.paymentPlan.create({
      data: {
        userId,
        name,
      },
    })

    return NextResponse.json(paymentPlan)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { paymentPlanId: string } }) {
  try {
    const { userId } = auth()
    const { name } = await req.json()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    const paymentPlan = await db.paymentPlan.update({
      where: {
        id: params.paymentPlanId,
        userId,
      },
      data: {
        name,
      },
    })

    return NextResponse.json(paymentPlan)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { paymentPlanId: string } }) {
  try {
    const { userId } = auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const paymentPlan = await db.paymentPlan.delete({
      where: {
        id: params.paymentPlanId,
        userId,
      },
    })

    return NextResponse.json(paymentPlan)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}
