import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"

export async function POST(req: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, budget = 0, periodDays = 30, isPrivate = false } = body

    if (!name?.trim()) {
      return NextResponse.json({ error: "Tên nhóm không được để trống" }, { status: 400 })
    }

    // 🧩 Đồng bộ user Clerk -> Prisma (tránh lỗi khóa ngoại)
    await prisma.user.upsert({
      where: { id: user.id },
      update: {
        name: user.fullName,
        email: user.emailAddresses[0]?.emailAddress,
        imageUrl: user.imageUrl,
      },
      create: {
        id: user.id,
        name: user.fullName,
        email: user.emailAddresses[0]?.emailAddress,
        imageUrl: user.imageUrl,
        password: "", // nếu không dùng password thật thì để trống
      },
    })

    const group = await prisma.group.create({
      data: {
        name,
        budget,
        periodDays,
        isPrivate,
        ownerId: user.id,
        memberships: {
          create: {
            userId: user.id,
            role: "owner",
          },
        },
      },
      include: {
        memberships: {
          include: { user: true },
        },
      },
    })

    return NextResponse.json(group, { status: 201 })
  } catch (error) {
    console.error("Error creating group:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json([], { status: 200 })
    }

    const memberships = await prisma.membership.findMany({
      where: { userId: user.id },
      include: { group: true },
    })

    const groups = memberships.map((m) => m.group)
    return NextResponse.json(groups)
  } catch (error) {
    console.error("Error fetching groups:", error)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
