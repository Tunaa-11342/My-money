import { prisma } from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"



export async function POST(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { message } = await req.json()

  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const existing = await prisma.notification.findFirst({
    where: {
      userId: user.id,
      message,
      createdAt: { gte: startOfDay },
    },
  })

  if (existing) {
    return NextResponse.json({ message: "Notification already sent today" }, { status: 200 })
  }

  const notification = await prisma.notification.create({
    data: { userId: user.id, message },
  })

  return NextResponse.json(notification)
}

export async function GET() {
  const notifications = await prisma.notification.findMany({
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(notifications)
}