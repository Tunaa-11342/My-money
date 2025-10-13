import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"
import { randomUUID } from "crypto"

/**
 * ===============================
 *  TẠO NHÓM MỚI (POST)
 * ===============================
 */
export async function POST(req: Request) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { name, isPrivate, maxMembers } = body

    if (!name || name.trim() === "") {
      return NextResponse.json(
        { error: "Tên nhóm không được để trống" },
        { status: 400 }
      )
    }

    const validMaxMembers =
      typeof maxMembers === "number" && maxMembers > 0 ? maxMembers : 5

    const newGroup = await prisma.group.create({
      data: {
        id: randomUUID(),
        name: name.trim(),
        isPrivate: !!isPrivate,
        maxMembers: validMaxMembers,
        members: {
          create: {
            userId: user.id,
            role: "admin", // 👑 Người tạo nhóm mặc định là admin
          },
        },
      },
      include: {
        members: true,
      },
    })

    return NextResponse.json(newGroup)
  } catch (error) {
    console.error("[GROUP_POST_ERROR]", error)
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 })
  }
}

/**
 * ===============================
 *  LẤY THÔNG TIN NHÓM (GET)
 * ===============================
 */
export async function GET(
  req: Request,
  { params }: { params: { groupId: string } }
) {
  try {
    const user = await currentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
      include: { members: true },
    })

    if (!group) {
      return NextResponse.json(
        { error: "Không tìm thấy nhóm" },
        { status: 404 }
      )
    }

    const member = group.members.find((m) => m.userId === user.id)
    const role = member?.role ?? "member"

    return NextResponse.json({
      id: group.id,
      name: group.name,
      isPrivate: group.isPrivate,
      members: group.members.length,
      maxMembers: group.maxMembers,
      role,
    })
  } catch (error) {
    console.error("[GROUP_GET_ERROR]", error)
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 })
  }
}
