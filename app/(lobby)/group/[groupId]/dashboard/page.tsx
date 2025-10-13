import { prisma } from '@/lib/prisma'
import { currentUser, clerkClient } from '@clerk/nextjs/server'
import { notFound } from 'next/navigation'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Users,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  PieChart,
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'

interface Props {
  params: { groupId: string }
}

export default async function GroupDashboard({ params }: Props) {
  const user = await currentUser()
  if (!user) return notFound()

  // ✅ Lấy nhóm + thành viên
  const group = await prisma.group.findUnique({
    where: { id: params.groupId },
    include: { members: true },
  })
  if (!group) return notFound()

  // ✅ Lấy thông tin Clerk của từng user trong nhóm
  const memberIds = group.members.map((m) => m.userId)
  const { data: users } = await clerkClient.users.getUserList({ userId: memberIds })

  // ✅ Gộp dữ liệu Clerk + Member
  const members = group.members.map((m) => {
    const userInfo = users.find((u) => u.id === m.userId)
    return {
      id: m.id,
      name:
        userInfo?.firstName && userInfo?.lastName
          ? `${userInfo.firstName} ${userInfo.lastName}`
          : userInfo?.username ||
            userInfo?.emailAddresses?.[0]?.emailAddress ||
            'Người dùng ẩn danh',
      avatar: userInfo?.imageUrl,
      role: m.role,
    }
  })

  // ✅ Mock dữ liệu chi tiêu (sau này thay Prisma Expense)
  const expenses = [
    { id: '1', name: 'Tiền điện nước', amount: 400000, dueDate: '2025-10-15', paidBy: ['user1'], type: 'utility' },
    { id: '2', name: 'Tiền ăn', amount: 600000, dueDate: '2025-10-18', paidBy: ['user2'], type: 'food' },
    { id: '3', name: 'Tiền mạng', amount: 300000, dueDate: '2025-10-20', paidBy: [], type: 'internet' },
  ]

  const totalGroupBudget = 1000000
  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0)
  const remainingBudget = totalGroupBudget - totalSpent
  const avgPerMember = totalSpent / (members.length || 1)

  return (
    <div className="space-y-6 p-6 text-white">
      {/* === Tổng quan nhóm === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Tổng chi tiêu nhóm</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-400">
              {formatCurrency(totalSpent)}
            </div>
            <p className="text-sm text-neutral-400">
              Giới hạn: {formatCurrency(totalGroupBudget)}
            </p>
            {remainingBudget < 0 && (
              <p className="text-red-500 text-xs mt-1">
                ⚠️ Vượt quá ngân sách nhóm!
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Trung bình mỗi thành viên</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-400">
              {formatCurrency(avgPerMember)}
            </div>
            <p className="text-xs text-neutral-400">Tính theo chia đều</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Số thành viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{members.length}</div>
            <p className="text-xs text-neutral-400">Thành viên trong nhóm</p>
          </CardContent>
        </Card>
      </div>

      {/* === Bảng chi tiêu === */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChart className="h-4 w-4" /> Các khoản chi hiện tại
          </CardTitle>
        </CardHeader>
        <CardContent>
          {expenses.length === 0 ? (
            <p className="text-neutral-400 text-sm">Chưa có khoản chi nào.</p>
          ) : (
            <div className="space-y-3">
              {expenses.map((exp) => {
                const isOverdue =
                  new Date(exp.dueDate) < new Date() && exp.paidBy.length === 0
                const daysLeft =
                  Math.ceil(
                    (new Date(exp.dueDate).getTime() - Date.now()) /
                      (1000 * 60 * 60 * 24)
                  ) || 0

                return (
                  <div
                    key={exp.id}
                    className="flex justify-between items-center border border-neutral-800 rounded-lg p-3 bg-neutral-900"
                  >
                    <div>
                      <p className="font-medium">{exp.name}</p>
                      <p className="text-sm text-neutral-400">
                        Hạn đóng: {exp.dueDate} – {formatCurrency(exp.amount)}
                      </p>
                      {isOverdue ? (
                        <p className="text-red-500 text-xs flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" /> Quá hạn chưa đóng!
                        </p>
                      ) : daysLeft <= 2 ? (
                        <p className="text-yellow-500 text-xs">
                          ⚠️ Gần đến hạn ({daysLeft} ngày)
                        </p>
                      ) : (
                        <p className="text-xs text-neutral-500">
                          {daysLeft} ngày còn lại
                        </p>
                      )}
                    </div>

                    <Button
                      size="sm"
                      variant={exp.paidBy.length ? 'outline' : 'default'}
                      className={
                        exp.paidBy.length
                          ? 'border-emerald-500 text-emerald-400'
                          : 'bg-emerald-600 hover:bg-emerald-700'
                      }
                    >
                      {exp.paidBy.length
                        ? `Đã đóng (${exp.paidBy.length})`
                        : 'Xác nhận đã đóng'}
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* === Thành viên === */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-4 w-4" /> Thành viên trong nhóm ({members.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {members.map((m) => (
              <div
                key={m.id}
                className="flex justify-between items-center border border-neutral-800 bg-neutral-900 rounded-lg p-3"
              >
                <div className="flex items-center gap-3">
                  <Avatar className="size-8 border border-neutral-700">
                    <AvatarImage src={m.avatar ?? undefined} alt={m.name} />
                    <AvatarFallback>
                      {m.name
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .toUpperCase()
                        .slice(0, 2)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{m.name}</p>
                    <p className="text-sm text-neutral-400">
                      Vai trò: {m.role === 'admin' ? 'Quản lý nhóm' : 'Thành viên'}
                    </p>
                  </div>
                </div>
                <Badge
                  variant={m.role === 'admin' ? 'default' : 'outline'}
                  className="capitalize"
                >
                  {m.role}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* === Nút hành động === */}
      <div className="flex justify-between items-center pt-6">
        <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
          Rời nhóm
        </Button>
        <Button variant="outline" className="border-neutral-700 hover:bg-neutral-800">
          Xóa nhóm
        </Button>
      </div>
    </div>
  )
}
