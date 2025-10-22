import { CreateGroupDialog } from '@/components/dialog/create-group'
import { JoinGroupDialog } from '@/components/dialog/join-group'
import { prisma } from '@/lib/prisma'
import { currentUser } from '@clerk/nextjs/server'
import { Users, PiggyBank, Wallet, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

export default async function GroupPage() {
  const user = await currentUser()
  if (!user)
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <PiggyBank className="w-12 h-12 text-indigo-400 mb-3" />
        <p className="text-lg font-medium">🔒 Vui lòng đăng nhập để xem nhóm</p>
      </div>
    )

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
    <div className="container py-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Nhóm của bạn
          </h1>
          <p className="text-muted-foreground mt-1">
            Quản lý chi tiêu nhóm, chia sẻ ngân sách và theo dõi thành viên.
          </p>
        </div>
        <div className="flex gap-2">
          <CreateGroupDialog />
          <JoinGroupDialog />
        </div>
      </div>

      {/* Empty state */}
      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 rounded-2xl border border-border bg-gradient-to-br from-indigo-500/10 to-purple-500/10 backdrop-blur-md text-center">
          <PiggyBank className="size-16 text-indigo-400 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Chưa có nhóm nào</h2>
          <p className="text-muted-foreground mb-6 max-w-sm">
            Hãy tạo nhóm mới hoặc tham gia nhóm sẵn có để cùng theo dõi chi tiêu!
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {groups.map((group) => (
            <a
              key={group.id}
              href={`/group/${group.id}`}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-indigo-400/60"
              )}
            >
              {/* background glow */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-lg truncate">{group.name}</h2>
                  {group.role === "owner" ? (
                    <Crown className="w-5 h-5 text-yellow-400" />
                  ) : (
                    <Users className="w-5 h-5 text-indigo-400" />
                  )}
                </div>

                <div className="space-y-1 text-sm text-muted-foreground">
                  <p>👥 Thành viên: {group.memberCount}</p>
                  <p>📅 Chu kỳ: {group.periodDays} ngày</p>
                  <p>
                    💰 Ngân sách:{" "}
                    <span className="font-medium text-foreground">
                      {group.budget?.toLocaleString("vi-VN")} ₫
                    </span>
                  </p>
                  <p>
                    🏷 Vai trò:{" "}
                    <span
                      className={cn(
                        "font-medium",
                        group.role === "owner" ? "text-yellow-400" : "text-indigo-400"
                      )}
                    >
                      {group.role === "owner" ? "Trưởng nhóm" : "Thành viên"}
                    </span>
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
