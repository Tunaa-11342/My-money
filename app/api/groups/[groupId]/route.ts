import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

export async function GET(_: Request, { params }: { params: { groupId: string } }) {
  try {
    const user = await currentUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

const group = await prisma.group.findUnique({
  where: { id: params.groupId },
  include: {
    memberships: {
      include: { user: true },
    },
  },
})

    if (!group) return NextResponse.json({ error: 'Group not found' }, { status: 404 })

    return NextResponse.json(group)
  } catch (error) {
    console.error('Error fetching group:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
