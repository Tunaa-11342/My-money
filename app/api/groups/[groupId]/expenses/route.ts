import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

export async function POST(req: Request, { params }: { params: { groupId: string } }) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { name, amount, note, categoryName, payerId, date } = await req.json()

    if (!name?.trim() || amount <= 0 || !categoryName || !payerId) {
      return NextResponse.json({ error: 'Thiếu thông tin khoản chi' }, { status: 400 })
    }

    const group = await prisma.group.findUnique({
      where: { id: params.groupId },
    })
    if (!group) return NextResponse.json({ error: 'Nhóm không tồn tại' }, { status: 404 })

    const expense = await prisma.expense.create({
      data: {
        name,
        amount,
        categoryName,
        createdBy: payerId,
        note,
        createdAt: date ? new Date(date) : new Date(),
        groupId: params.groupId,
      },
    })

    return NextResponse.json(expense, { status: 201 })
  } catch (error) {
    console.error('Error adding expense:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
