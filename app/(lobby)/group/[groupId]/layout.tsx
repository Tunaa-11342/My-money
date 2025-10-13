"use client"

import Link from "next/link"
import { ReactNode, useEffect, useState } from "react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  Home,
  FileClock,
  ReceiptText,
  Settings,
  Users,
  ShieldAlert,
  Activity,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

// data nhóm
async function fetchGroup(groupId: string) {
  const res = await fetch(`/api/groups/${groupId}`, { cache: "no-store" })
  console.log("Fetch group:", groupId, "Status:", res.status)
  if (!res.ok) {
    const text = await res.text()
    console.error("Response body:", text)
    throw new Error("Không thể tải thông tin nhóm")
  }
  return res.json()
}

export default function GroupLayout({
  children,
  params,
}: {
  children: ReactNode
  params: { groupId: string }
}) {
  const { groupId } = params
  const pathname = usePathname()
  const [group, setGroup] = useState<any>(null)

  useEffect(() => {
    fetchGroup(groupId).then(setGroup)
  }, [groupId])

  const links = [
    { href: `/group/${groupId}/dashboard`, label: "Bảng điều khiển", icon: Home },
    { href: `/group/${groupId}/invoices`, label: "Hóa đơn", icon: ReceiptText },
    { href: `/group/${groupId}/history`, label: "Lịch sử", icon: FileClock },
  ]

  if (!group) return <div className="p-6 text-neutral-400">Đang tải...</div>

  return (
    <div className="p-6 space-y-6 text-white">
      {/* === Tầng 1: Tên nhóm + ID === */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-neutral-800 pb-3">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            🏠 {group.name}
          </h2>
          <p className="text-neutral-500 text-sm">ID nhóm: {group.id}</p>
        </div>
        <div className="bg-emerald-700 px-3 py-1 rounded-full text-sm font-medium mt-3 md:mt-0">
          {group.members}/{group.maxMembers} thành viên
        </div>
      </div>

      {/* === Tầng 2: Thanh điều hướng nhóm === */}
      <div className="flex items-center gap-6 border-b border-neutral-800 pb-3 text-sm font-medium">
        {links.map((link) => {
          const Icon = link.icon
          const active = pathname?.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-1 transition-colors",
                active
                  ? "text-emerald-400 border-b-2 border-emerald-500 pb-1"
                  : "text-neutral-400 hover:text-emerald-300"
              )}
            >
              <Icon className="h-4 w-4" />
              {link.label}
            </Link>
          )
        })}
      </div>

      {/* === Layout 2 cột === */}
      <div className="grid grid-cols-12 gap-6">
        {/* Sidebar trái */}
        <div className="col-span-12 md:col-span-3 space-y-4">
          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Activity className="h-4 w-4" />
                Hành động nhanh
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button
                className="w-full"
                variant="outline"
                onClick={() => alert("📨 Sau này sẽ mở dialog mời thành viên")}
              >
                + Mời thành viên
              </Button>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => alert("➕ Sau này mở form thêm chi tiêu")}
              >
                + Thêm chi tiêu
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Settings className="h-4 w-4" /> Cài đặt nhóm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div>
                <p className="text-neutral-400">Tên nhóm</p>
                <input
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-1 text-white"
                  defaultValue={group.name}
                />
              </div>
              <div>
                <p className="text-neutral-400">Số thành viên tối đa</p>
                <input
                  type="number"
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-1 text-white"
                  defaultValue={group.maxMembers}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={group.isPrivate}
                  className="accent-emerald-500"
                />
                <span className="text-sm">Chế độ riêng tư</span>
              </div>
              <Button className="w-full bg-emerald-600 hover:bg-emerald-700">
                💾 Lưu thay đổi
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-neutral-900 border-neutral-800">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base text-red-500">
                <ShieldAlert className="h-4 w-4" /> Nguy hiểm
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="destructive" className="w-full">
                Rời nhóm
              </Button>
              <Button
                variant="destructive"
                className="w-full bg-red-700 hover:bg-red-800"
              >
                Xóa nhóm
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Nội dung chính */}
        <div className="col-span-12 md:col-span-9">{children}</div>
      </div>
    </div>
  )
}
