import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { AddExpenseDialog } from "@/components/dialog/group-expense";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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

  const isOwner = group.ownerId === user.id;

  return (
    <div className="container py-10">
      {/* 🏷️ Tiêu đề nhóm + thanh điều hướng */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">{group.name}</h1>
          <p className="text-muted-foreground">
            Ngân sách: {group.budget.toLocaleString()} VNĐ / {group.periodDays}{" "}
            ngày
          </p>
        </div>

        <nav className="mt-4 sm:mt-0 flex gap-3">
          <Button variant="default">Bảng điều khiển</Button>
          <Button variant="outline">Báo cáo</Button>
        </nav>
      </div>

      {/* 📄 Bố cục chính */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-6">
        {/* SIDEBAR (2 phần) */}
        <aside className="lg:col-span-2 space-y-6">
          {/* ⚡ Hành động nhanh */}
          <div className="border rounded-lg p-4 space-y-3">
            <h2 className="font-semibold text-lg">Hành động nhanh</h2>
            <AddExpenseDialog groupId={group.id} />
            <Button variant="secondary" className="w-full">
              + Mời thành viên
            </Button>
          </div>

          {/* 👥 Quản lý thành viên */}
          <div className="border rounded-lg p-4 space-y-3">
            <h2 className="font-semibold text-lg">Quản lý thành viên</h2>
            <ul className="space-y-2">
              {group.memberships.map((m) => (
                <li key={m.id} className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Avatar className="size-8">
                      <AvatarImage
                        src={m.user.imageUrl ?? undefined}
                        alt={m.user.name ?? ""}
                      />
                      <AvatarFallback seed={m.userId} />
                    </Avatar>
                    <span className="truncate font-medium">
                      {m.user.name ?? "Người dùng ẩn danh"}
                    </span>
                  </div>

                  {isOwner && m.userId !== user.id && (
                    <Button size="sm" variant="destructive">
                      Xóa
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          </div>
          {/* ⚙️ Cài đặt phòng */}
          <div className="border rounded-lg p-4 space-y-4">
            <h2 className="font-semibold text-lg">Cài đặt phòng</h2>

            <div className="space-y-2">
              <Label>Tên phòng</Label>
              <Input defaultValue={group.name} />
            </div>

            <div className="space-y-2">
              <Label>Giới hạn thành viên</Label>
              <Input type="number" placeholder="Nhập số lượng tối đa" />
            </div>

            <div className="flex items-center justify-between">
              <Label>Chế độ riêng tư</Label>
              <Switch defaultChecked={group.isPrivate} />
            </div>

            <Button className="w-full" variant="default">
              Lưu thay đổi
            </Button>
          </div>

          {/* 🚪 Rời phòng / Xóa phòng */}
          <div className="border rounded-lg p-4 space-y-3">
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

        {/* MAIN CONTENT (8 phần) */}
        <section className="lg:col-span-8 space-y-6">
          {/* Dashboard tổng quan */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-1">Ngân sách</h3>
              <p className="text-2xl font-bold text-emerald-600">
                {group.budget.toLocaleString()} VNĐ
              </p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-1">Thành viên</h3>
              <p className="text-2xl font-bold">{group.memberships.length}</p>
            </div>

            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-1">Chi tiêu</h3>
              <p className="text-2xl font-bold text-red-500">
                {group.expenses
                  .reduce((a, b) => a + b.amount, 0)
                  .toLocaleString()}{" "}
                VNĐ
              </p>
            </div>
          </div>

          {/*  Danh sách khoản chi*/}
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold text-lg mb-3">Danh sách khoản chi</h2>

            {group.expenses.length === 0 ? (
              <p className="text-muted-foreground">Chưa có khoản chi nào.</p>
            ) : (
              <ul className="divide-y">
                {group.expenses.map((e) => {
                  const payer = group.memberships.find(
                    (m) => m.userId === e.createdBy
                  )?.user;
                  return (
                    <li
                      key={e.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 py-3"
                    >
                      <div className="flex items-start gap-3">
                        {/* Thông tin chi tiết */}
                        <div>
                          <div className="font-semibold">{e.name}</div>
                          <div className="text-sm text-muted-foreground">
                            🧍 Người chi:{" "}
                            <span className="text-foreground font-medium">
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
                            <div className="text-sm text-muted-foreground">
                              📝 Ghi chú:{" "}
                              <span className="italic text-foreground">
                                {e.note}
                              </span>
                            </div>
                          )}
                          <div className="text-sm text-muted-foreground">
                            📅 Ngày:{" "}
                            <span className="text-foreground">
                              {new Date(e.createdAt).toLocaleDateString(
                                "vi-VN"
                              )}
                            </span>
                          </div>
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
