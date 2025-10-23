import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { AddExpenseDialog } from "@/components/dialog/group-expense";
import { InviteMemberDialog } from "@/components/dialog/invite-member-dialog";

interface GroupPageProps {
  params: { groupId: string };
}

const CATEGORY_LABELS: Record<string, string> = {
  food: "🍜 Ăn uống",
  transport: "🚌 Di chuyển",
  shopping: "🛍️ Mua sắm",
  entertainment: "🎮 Giải trí",
  other: "📦 Khác",
};

export default async function GroupDetailPage({ params }: GroupPageProps) {
  const user = await currentUser();
  if (!user) return <p className="p-4">Vui lòng đăng nhập để xem nhóm</p>;

  const group = await prisma.group.findUnique({
    where: { id: params.groupId },
    include: {
      memberships: {
        include: { user: true },
      },
      expenses: true,
    },
  });

  if (!group) {
    return <p className="p-4 text-red-500">Không tìm thấy nhóm.</p>;
  }

  const totalExpense = group.expenses.reduce((a, b) => a + b.amount, 0);
  const remaining = group.budget - totalExpense;
  const isOwner = group.ownerId === user.id;

  return (
    <div className="container py-10">
      {/* 🏷️ Tiêu đề nhóm */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-transparent bg-clip-text">
            {group.name}
          </h1>
          <p className="text-muted-foreground">
            Ngân sách:{" "}
            <span className="font-semibold text-emerald-600">
              {group.budget.toLocaleString()} VNĐ
            </span>{" "}
            / {group.periodDays} ngày
          </p>
        </div>

        <nav className="mt-4 sm:mt-0 flex gap-3">
          <Button variant="default">Bảng điều khiển</Button>
          <Button variant="outline">Báo cáo</Button>
        </nav>
      </div>

      {/* 📄 Bố cục chính */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* SIDEBAR */}
        <aside className="lg:col-span-2 space-y-6">
          {/* ⚡ Hành động nhanh */}
          <div className="border rounded-xl p-4 space-y-4 shadow-md bg-gradient-to-br from-indigo-500/5 via-background to-purple-500/5 backdrop-blur-sm">
            <h2 className="font-semibold text-lg">Hành động nhanh</h2>
            <AddExpenseDialog groupId={group.id} />
            <InviteMemberDialog inviteCode={group.inviteCode} />
          </div>

          {/* 🚪 Rời hoặc Xóa phòng */}
          <div className="border rounded-xl p-4 space-y-3 shadow-md bg-gradient-to-br from-red-500/5 via-background to-orange-500/5 backdrop-blur-sm">
            {isOwner ? (
              <Button variant="destructive" className="w-full">
                Xóa phòng
              </Button>
            ) : (
              <Button variant="secondary" className="w-full">
                Rời phòng
              </Button>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <section className="lg:col-span-8 space-y-6">
          {/* Dashboard tổng quan */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Ngân sách */}
            <div className="p-5 rounded-xl border bg-gradient-to-br from-emerald-500/10 via-background to-emerald-500/5 hover:shadow-lg transition-all">
              <h3 className="font-medium mb-1">Ngân sách</h3>
              <p className="text-2xl font-bold text-emerald-600">
                {group.budget.toLocaleString()} VNĐ
              </p>
            </div>

            {/* Số tiền còn lại */}
            <div className="p-5 rounded-xl border bg-gradient-to-br from-blue-500/10 via-background to-indigo-500/5 hover:shadow-lg transition-all">
              <h3 className="font-medium mb-1">Số tiền còn lại</h3>
              <p
                className={`text-2xl font-bold ${
                  remaining < 0 ? "text-red-500" : "text-blue-600"
                }`}
              >
                {remaining.toLocaleString()} VNĐ
              </p>
            </div>

            {/* Chi tiêu */}
            <div className="p-5 rounded-xl border bg-gradient-to-br from-rose-500/10 via-background to-red-500/5 hover:shadow-lg transition-all">
              <h3 className="font-medium mb-1">Chi tiêu</h3>
              <p className="text-2xl font-bold text-red-500">
                {totalExpense.toLocaleString()} VNĐ
              </p>
            </div>
          </div>

          {/* Danh sách khoản chi */}
          <div className="border rounded-xl p-5 bg-gradient-to-br from-indigo-500/5 via-background to-purple-500/5 shadow-md">
            <h2 className="font-semibold text-lg mb-3">
              Danh sách khoản chi
            </h2>

            {group.expenses.length === 0 ? (
              <p className="text-muted-foreground italic">
                Chưa có khoản chi nào.
              </p>
            ) : (
              <ul className="divide-y">
                {group.expenses.map((e) => {
                  const payer = group.memberships.find(
                    (m) => m.userId === e.createdBy
                  )?.user;
                  return (
                    <li
                      key={e.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 hover:bg-muted/30 rounded-md px-2 transition-colors"
                    >
                      <div>
                        <div className="font-semibold">{e.name}</div>
                        <div className="text-sm text-muted-foreground">
                          🧍 Người chi:{" "}
                          <span className="font-medium text-foreground">
                            {payer?.name ?? e.createdBy}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          🏷️ Danh mục:{" "}
                          <span className="text-foreground">
                            {CATEGORY_LABELS[e.categoryName] ?? e.categoryName}
                          </span>
                        </div>
                        {e.note && (
                          <div className="text-sm text-muted-foreground">
                            📝{" "}
                            <span className="italic text-foreground">
                              {e.note}
                            </span>
                          </div>
                        )}
                        <div className="text-sm text-muted-foreground">
                          📅{" "}
                          <span className="text-foreground">
                            {new Date(e.createdAt).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                      </div>

                      <span className="text-lg font-bold text-red-500">
                        {e.amount.toLocaleString("vi-VN")} VNĐ
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
