import { db } from "@/lib/db"
import { auth } from "@clerk/nextjs"
import { NextResponse } from "next/server"

export async function getNotifications() {
  try {
    const { userId } = auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const notifications = await db.notification.findMany({
      where: {
        userId: userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return notifications
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function markNotificationAsRead(notificationId: string) {
  try {
    const { userId } = auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const notification = await db.notification.update({
      where: {
        id: notificationId,
        userId: userId,
      },
      data: {
        read: true,
      },
    })

    return notification
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}

export async function createNotification(userId: string, title: string, description: string, link?: string) {
  try {
    const notification = await db.notification.create({
      data: {
        userId: userId,
        title: title,
        description: description,
        link: link,
      },
    })

    return notification
  } catch (error) {
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
