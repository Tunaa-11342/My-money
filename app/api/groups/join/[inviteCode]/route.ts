import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { syncCurrentUser } from "@/lib/syncUser"

export async function POST(
  req: Request,
  { params }: { params: { inviteCode: string } }
) {
  try {
    const user = await syncCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { inviteCode } = params
    const group = await prisma.group.findUnique({ where: { inviteCode } })
    if (!group) {
      return NextResponse.json({ error: "Mã mời không hợp lệ" }, { status: 404 })
    }

    const existing = await prisma.membership.findFirst({
      where: { userId: user.id, groupId: group.id },
    })
    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Bạn đã là thành viên của nhóm này",
        groupId: group.id,
      })
    }

    await prisma.membership.create({
      data: { userId: user.id, groupId: group.id, role: "MEMBER" },
    })

    return NextResponse.json({
      success: true,
      message: "Tham gia nhóm thành công!",
      groupId: group.id,
    })
  } catch (error) {
    console.error("❌ Error joining group:", error)
    return NextResponse.json({ error: "Lỗi máy chủ" }, { status: 500 })
  }
}
