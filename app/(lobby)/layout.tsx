import { ReactNode } from "react"

import { getCachedUser } from "@/lib/queries/user"
import { getCacheUserSetting } from "@/lib/actions/user-setting"

import { SiteHeader } from "@/components/layouts/site-header"
import { SiteFooter } from "@/components/layouts/site-footer"

import { syncCurrentUser } from "@/lib/syncUser"

interface LobyLayoutProps {
  children: ReactNode
  modal: ReactNode
}

export default async function LobyLayout({ children, modal }: LobyLayoutProps) {
  // 1) Đồng bộ user vào DB (nếu chưa có)
  await syncCurrentUser()

  // 2) Lấy thông tin user từ Clerk cache
  const user = await getCachedUser()

  // 3) Lấy user settings (currency, budget, theme…)
  const userSettings = user
    ? await getCacheUserSetting(user.id)
    : null

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader user={user} userSettings={userSettings} />

      <main className="flex-1">
        {children}
        {/* {modal} */}
      </main>

      {/* <SiteFooter /> */}
    </div>
  )
}
