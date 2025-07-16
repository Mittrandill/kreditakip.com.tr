import { db } from "@/lib/db"
import { currentProfile } from "@/lib/current-profile"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const profile = await currentProfile()

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { name } = await req.json()

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    const account = await db.account.create({
      data: {
        profileId: profile.id,
        name,
      },
    })

    return NextResponse.json(account)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { accountId: string } }) {
  try {
    const profile = await currentProfile()
    const { name } = await req.json()

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (!name) {
      return new NextResponse("Name is required", { status: 400 })
    }

    const account = await db.account.update({
      where: {
        id: params.accountId,
      },
      data: {
        name,
      },
    })

    return NextResponse.json(account)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { accountId: string } }) {
  try {
    const profile = await currentProfile()

    if (!profile) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const account = await db.account.delete({
      where: {
        id: params.accountId,
      },
    })

    return NextResponse.json(account)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}
