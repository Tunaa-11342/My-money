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
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const notifications = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  })
  return NextResponse.json(notifications)
}

export async function PATCH() {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  await prisma.notification.updateMany({
    where: { userId: user.id, read: false },
    data: { read: true },
  })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: Request) {
  const user = await currentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()

  await prisma.notification.deleteMany({
    where: {
      id,
      userId: user.id,
    },
  })

  return NextResponse.json({ success: true })
}
