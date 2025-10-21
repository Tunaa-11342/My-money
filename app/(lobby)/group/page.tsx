import { CreateGroupDialog } from '@/components/dialog/create-group'
import { JoinGroupDialog } from '@/components/dialog/join-group'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'

export default async function GroupPage() {
  const user = await currentUser()
  if (!user) return <p className="p-4">Vui lòng đăng nhập để xem nhóm</p>

  // ⚙️ Lấy nhóm trực tiếp bằng Prisma
  const memberships = await prisma.membership.findMany({
    where: { userId: user.id },
    include: {
      group: {
        include: {
          _count: { select: { memberships: true } },
        },
      },
    },
  })

  const groups = memberships.map((m) => ({
    id: m.group.id,
    name: m.group.name,
    budget: m.group.budget,
    periodDays: m.group.periodDays,
    memberCount: m.group._count.memberships,
    role: m.role,
  }))

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Danh sách nhóm</h1>
        <div className="flex gap-2">
          <CreateGroupDialog />
          <JoinGroupDialog />
        </div>
      </div>

      {groups.length === 0 ? (
        <p>Chưa có nhóm nào.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {groups.map((group) => (
            <a
              key={group.id}
              href={`/group/${group.id}`}
              className="p-4 border rounded-lg hover:bg-accent transition"
            >
              <h2 className="font-semibold text-lg">{group.name}</h2>
              <p className="text-sm text-muted-foreground">
                Thành viên: {group.memberCount}
              </p>
              <p className="text-sm text-muted-foreground">
                Vai trò: {group.role === 'owner' ? 'Trưởng nhóm' : 'Thành viên'}
              </p>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
