import { db } from "@/lib/db"
import { auth } from "@clerk/nextjs"
import { NextResponse } from "next/server"

export async function POST(req: Request, { params }: { params: { courseId: string } }) {
  try {
    const { userId } = auth()
    const { credits } = await req.json()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    if (!credits || typeof credits !== "number") {
      return new NextResponse("Credits are required and must be a number", { status: 400 })
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId: userId,
      },
    })

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const newCredits = await db.course.update({
      where: {
        id: params.courseId,
        userId: userId,
      },
      data: {
        credits: credits,
      },
    })

    return NextResponse.json(newCredits)
  } catch (error) {
    return new NextResponse("Internal Error", { status: 500 })
  }
}
