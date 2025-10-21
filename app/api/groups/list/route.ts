export const runtime = "nodejs"
export const dynamic = "force-dynamic"


import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

export const revalidate = 0

export async function GET() {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json([], { status: 200 })

const memberships = await prisma.membership.findMany({
  where: { userId: user.id },
  include: {
    group: {
      include: {
        _count: { select: { memberships: true } }, // đếm ở DB
      },
    },
  },
})

const groups = memberships.map((m) => ({
  id: m.group.id,
  name: m.group.name,
  budget: m.group.budget,
  periodDays: m.group.periodDays,
  memberCount: m.group._count.memberships, // đếm 
  isPrivate: m.group.isPrivate,
  role: m.role,
}))

    return NextResponse.json(groups)
  } catch (error) {
    console.error('Error fetching groups:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
