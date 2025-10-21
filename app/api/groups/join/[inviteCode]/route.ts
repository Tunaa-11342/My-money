import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
<<<<<<< HEAD
import { currentUser } from "@clerk/nextjs/server"
=======
import { syncCurrentUser } from "@/lib/syncUser"
>>>>>>> 242a3a1 (Fix bugs: JoinGroup day 2)

export async function POST(
  req: Request,
  { params }: { params: { inviteCode: string } }
) {
<<<<<<< HEAD
  return joinGroup(params.inviteCode)
}

export async function GET(
  req: Request,
  { params }: { params: { inviteCode: string } }
) {
  return joinGroup(params.inviteCode)
}

async function joinGroup(inviteCode: string) {
  try {
    const user = await currentUser()
=======
  try {
    const user = await syncCurrentUser()
>>>>>>> 242a3a1 (Fix bugs: JoinGroup day 2)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

<<<<<<< HEAD
    const group = await prisma.group.findUnique({
      where: { inviteCode },
    })

    if (!group) {
      return NextResponse.json({ error: "Không tìm thấy nhóm" }, { status: 404 })
=======
    const { inviteCode } = params
    const group = await prisma.group.findUnique({ where: { inviteCode } })
    if (!group) {
      return NextResponse.json({ error: "Mã mời không hợp lệ" }, { status: 404 })
>>>>>>> 242a3a1 (Fix bugs: JoinGroup day 2)
    }

    const existing = await prisma.membership.findFirst({
      where: { userId: user.id, groupId: group.id },
    })
<<<<<<< HEAD

    if (existing) {
      return NextResponse.json({
        message: "Bạn đã ở trong nhóm này rồi.",
=======
    if (existing) {
      return NextResponse.json({
        success: true,
        message: "Bạn đã là thành viên của nhóm này",
>>>>>>> 242a3a1 (Fix bugs: JoinGroup day 2)
        groupId: group.id,
      })
    }

    await prisma.membership.create({
<<<<<<< HEAD
      data: {
        userId: user.id,
        groupId: group.id,
        role: "MEMBER",
      },
    })

    return NextResponse.json({ success: true, groupId: group.id })
  } catch (err) {
    console.error("Join group error:", err)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
=======
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
>>>>>>> 242a3a1 (Fix bugs: JoinGroup day 2)
  }
}
