import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { currentUser } from "@clerk/nextjs/server"

export async function POST(req: Request) {
  try {
    const me = await currentUser()
    if (!me) return NextResponse.json({ error: "Chưa đăng nhập" }, { status: 401 })

    const { groupId, memberId } = await req.json()
    if (!groupId || !memberId) {
      return NextResponse.json({ error: "Thiếu thông tin" }, { status: 400 })
    }

    const group = await prisma.group.findUnique({ where: { id: groupId } })
    if (!group) return NextResponse.json({ error: "Không tìm thấy nhóm" }, { status: 404 })

    // chỉ owner được xóa
    if (group.ownerId !== me.id) {
      return NextResponse.json({ error: "Bạn không có quyền xóa thành viên" }, { status: 403 })
    }

    // không cho xóa chính chủ nhóm qua API này
    if (memberId === me.id) {
      return NextResponse.json({ error: "Owner không thể tự xóa ở đây" }, { status: 400 })
    }

    await prisma.membership.deleteMany({
      where: { userId: memberId, groupId },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error("remove-member error:", err)
    return NextResponse.json({ error: "Lỗi server" }, { status: 500 })
  }
}
