import { prisma } from "@/lib/prisma";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import CreateGroupDialog from "@/components/dialog/create-room";

export default async function GroupPage() {
  const user = await currentUser();
  if (!user) {
    return (
      <div className="p-6 text-center text-neutral-400">
        Bạn cần đăng nhập để xem danh sách nhóm.
      </div>
    );
  }

  // ✅ Lấy các nhóm mà user là thành viên
  const memberships = await prisma.member.findMany({
    where: { userId: user.id },
    include: { group: true },
  });

  const groups = memberships.map((m) => m.group);

  return (
    <div className="p-6 text-white">
      {/* Header + các nút hành động */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Danh sách nhóm 💬</h1>

        <div className="flex items-center gap-2">
          {/* Nút mở dialog tạo nhóm */}
          <CreateGroupDialog
            trigger={
              <Button className="bg-emerald-500 hover:bg-emerald-600 text-white">
                + Tạo nhóm
              </Button>
            }
          />

          {/* Nút tham gia nhóm */}
          <Link href="/group/join">
            <Button
              variant="outline"
              className="border-neutral-700 text-neutral-300 hover:bg-neutral-800"
            >
              Tham gia nhóm
            </Button>
          </Link>
        </div>
      </div>

      {/* Danh sách nhóm */}
      {groups.length === 0 ? (
        <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4 text-center text-neutral-400">
          Hiện bạn chưa tham gia nhóm nào.
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <div
              key={group.id}
              className="flex justify-between items-center border border-neutral-800 bg-neutral-900 rounded-xl p-4"
            >
              <div>
                <h2 className="text-lg font-semibold">{group.name}</h2>
                <p className="text-sm text-neutral-400">
                  ID nhóm: <span className="font-mono">{group.id}</span>
                  <br />
                  {group.isPrivate ? "🔒 Riêng tư" : "🌐 Công khai"}
                </p>
              </div>
              <Link href={`/group/${group.id}/dashboard`}>
                <Button
                  variant="outline"
                  className="border-neutral-700 text-emerald-400 hover:bg-neutral-800"
                >
                  Xem chi tiết →
                </Button>
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
