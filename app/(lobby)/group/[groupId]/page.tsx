import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { AddExpenseDialog } from "@/components/dialog/group-expense";
import { InviteMemberDialog } from "@/components/dialog/invite-member-dialog";
import Link from "next/link";
import GroupReport from "@/components/group/group-report";
interface GroupPageProps {
  params: { groupId: string };
  searchParams: { view?: string };
}

const CATEGORY_LABELS: Record<string, string> = {
  food: "🍜 Ăn uống",
  transport: "🚌 Di chuyển",
  shopping: "🛍️ Mua sắm",
  entertainment: "🎮 Giải trí",
  other: "📦 Khác",
};

export default async function GroupDetailPage({
  params,
  searchParams,
}: GroupPageProps) {
  const currentView = searchParams.view === "report" ? "report" : "dashboard";
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
          <Link
            href={`/group/${params.groupId}?view=dashboard`}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              currentView === "dashboard"
                ? "bg-primary text-primary-foreground shadow"
                : "border border-border hover:bg-muted"
            }`}
          >
            Bảng điều khiển
          </Link>

          <Link
            href={`/group/${params.groupId}?view=report`}
            className={`px-4 py-2 rounded-md font-medium transition-all ${
              currentView === "report"
                ? "bg-primary text-primary-foreground shadow"
                : "border border-border hover:bg-muted"
            }`}
          >
            Báo cáo
          </Link>
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
          {currentView === "dashboard" && (
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
          )}
          {/* Danh sách khoản chi */}
          {currentView === "dashboard" && (
            <div className="border rounded-xl p-5 bg-gradient-to-br from-indigo-500/5 via-background to-purple-500/5 shadow-md">
              <h2 className="font-semibold text-lg mb-3">
                Danh sách khoản chi
              </h2>

              {group.expenses.length === 0 ? (
                <p className="text-muted-foreground italic">
                  Chưa có khoản chi nào.
                </p>
              ) : (
                <ul className="space-y-3">
                  {group.expenses.map((e) => {
                    const payer = group.memberships.find(
                      (m) => m.userId === e.createdBy
                    )?.user;

                    return (
                      <li
                        key={e.id}
                        className="group relative flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border/40 
                   bg-gradient-to-br from-background via-background/70 to-indigo-500/5 
                   hover:shadow-lg hover:border-indigo-400/40 transition-all duration-300 overflow-hidden"
                      >
                        {/* Hiệu ứng nền mờ khi hover */}
                        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl" />

                        {/* Nội dung chính */}
                        <div className="relative z-10">
                          <div className="font-semibold text-base">
                            {e.name}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            🧍 Người chi:{" "}
                            <span className="font-medium text-foreground">
                              {payer?.name ?? e.createdBy}
                            </span>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            🏷️ Danh mục:{" "}
                            <span className="text-foreground">
                              {CATEGORY_LABELS[e.categoryName] ??
                                e.categoryName}
                            </span>
                          </div>
                          {e.note && (
                            <div className="text-sm text-muted-foreground italic">
                              📝 {e.note}
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            📅{" "}
                            <span className="text-foreground">
                              {new Date(e.createdAt).toLocaleDateString(
                                "vi-VN"
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Số tiền */}
                        <span className="relative z-10 text-lg font-bold text-red-500 bg-white/5 px-3 py-1 rounded-lg shadow-sm">
                          {e.amount.toLocaleString("vi-VN")} VNĐ
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          )}
          {currentView === "report" && (
            <div className="relative overflow-hidden rounded-2xl border border-white/10 shadow-2xl bg-background/50 backdrop-blur-2xl">
              {/* Hiệu ứng nền gradient động */}
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-purple-500/10 to-pink-500/20 blur-3xl animate-pulse-slow" />

              <div className="relative z-10 p-8 space-y-8">
                {/* Tiêu đề */}
                <div className="text-center">
                  <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    Báo cáo chi tiêu nhóm
                  </h2>
                  <p className="text-muted-foreground mt-2">
                    Tổng quan chi tiêu theo danh mục và thành viên.
                  </p>
                </div>

                {/* Tổng kết nhanh */}
                <div className="grid sm:grid-cols-3 gap-4">
                  <div className="p-5 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-white/10 shadow-lg hover:shadow-indigo-500/20 transition-all">
                    <p className="text-sm text-muted-foreground">
                      Tổng chi tiêu
                    </p>
                    <h3 className="text-2xl font-bold text-indigo-600">
                      {group.expenses
                        .reduce((a, b) => a + b.amount, 0)
                        .toLocaleString()}{" "}
                      ₫
                    </h3>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-500/10 to-lime-500/10 border border-white/10 shadow-lg hover:shadow-emerald-500/20 transition-all">
                    <p className="text-sm text-muted-foreground">
                      Ngân sách còn lại
                    </p>
                    <h3
                      className={`text-2xl font-bold ${
                        group.budget -
                          group.expenses.reduce((a, b) => a + b.amount, 0) <
                        0
                          ? "text-red-500"
                          : "text-emerald-600"
                      }`}
                    >
                      {(
                        group.budget -
                        group.expenses.reduce((a, b) => a + b.amount, 0)
                      ).toLocaleString()}{" "}
                      ₫
                    </h3>
                  </div>

                  <div className="p-5 rounded-2xl bg-gradient-to-r from-orange-500/10 to-yellow-500/10 border border-white/10 shadow-lg hover:shadow-orange-500/20 transition-all">
                    <p className="text-sm text-muted-foreground">
                      Người chi nhiều nhất
                    </p>
                    <h3 className="text-2xl font-bold text-orange-600">
                      {(() => {
                        if (group.expenses.length === 0)
                          return "Chưa có dữ liệu";
                        const map: Record<string, number> = {};
                        for (const e of group.expenses) {
                          const payer =
                            group.memberships.find(
                              (m) => m.userId === e.createdBy
                            )?.user?.name ?? "Ẩn danh";
                          map[payer] = (map[payer] || 0) + e.amount;
                        }
                        const top = Object.entries(map).sort(
                          (a, b) => b[1] - a[1]
                        )[0];
                        return `${top[0]} (${top[1].toLocaleString()} ₫)`;
                      })()}
                    </h3>
                  </div>
                </div>

                {/* Biểu đồ */}
                <div className="mt-6 transition-colors duration-500">
                  <GroupReport
                    expenses={group.expenses}
                    memberships={group.memberships as any}
                    categoryLabels={{
                      food: "🍜 Ăn uống",
                      transport: "🚌 Di chuyển",
                      shopping: "🛍️ Mua sắm",
                      entertainment: "🎮 Giải trí",
                      other: "📦 Khác",
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
