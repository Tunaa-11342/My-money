import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) {
      // Nếu chưa đăng nhập thì trả về mảng trống, không lỗi
      return NextResponse.json([], { status: 200 })
    }

    // ✅ Lấy tất cả nhóm mà user này là thành viên
    const memberships = await prisma.member.findMany({
      where: { userId: user.id },
      include: { group: true },
    })

    // ✅ Trích danh sách nhóm
    const groups = memberships.map((m) => m.group)

    return NextResponse.json(groups)
  } catch (error) {
    console.error('[GROUP_GET_ALL_ERROR]', error)
    return NextResponse.json(
      { error: 'Lỗi máy chủ khi tải danh sách nhóm' },
      { status: 500 }
    )
  }
}
