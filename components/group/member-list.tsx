"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

type UserLite = { id: string; name: string | null; imageUrl: string | null }
type Member = { id: string; userId: string; user: UserLite }

export function MemberList({
  groupId,
  initialMembers,
  isOwner,
  currentUserId,
}: {
  groupId: string
  initialMembers: Member[]
  isOwner: boolean
  currentUserId: string
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handleRemove = async (memberId: string) => {
    if (!isOwner) return
    const target = members.find((m) => m.userId === memberId)
    if (!target) return
    if (!confirm(`Xóa ${target.user.name ?? "thành viên"} khỏi nhóm?`)) return

    try {
      setLoadingId(memberId)
      const res = await fetch("/api/groups/remove-member", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, memberId }),
      })
      const data = await res.json()

      if (res.ok && data?.success) {
        setMembers((prev) => prev.filter((m) => m.userId !== memberId))
        toast.success("Đã xóa thành viên khỏi nhóm.")
      } else {
        toast.error(data?.error || "Không thể xóa thành viên.")
      }
    } catch (e) {
      console.error(e)
      toast.error("Lỗi kết nối máy chủ.")
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <div className="border rounded-lg p-4 space-y-3">
      <h2 className="font-semibold text-lg">Quản lý thành viên</h2>
      <ul className="space-y-2">
        {members.map((m) => (
          <li key={m.id} className="flex justify-between items-center">
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="size-8 shrink-0">
                <AvatarImage src={m.user.imageUrl ?? undefined} alt={m.user.name ?? ""} />
                <AvatarFallback>{(m.user.name ?? "?").slice(0,1).toUpperCase()}</AvatarFallback>
              </Avatar>
              <span className="truncate font-medium">
                {m.user.name ?? "Người dùng ẩn danh"}
              </span>
            </div>

            {isOwner && m.userId !== currentUserId && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => handleRemove(m.userId)}
                disabled={loadingId === m.userId}
              >
                {loadingId === m.userId ? "Đang xóa..." : "Xóa"}
              </Button>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
