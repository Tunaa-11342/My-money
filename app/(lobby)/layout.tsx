import { ReactNode } from "react"

import { getCachedUser } from "@/lib/queries/user"
import { getCreateUserSetting } from "@/lib/actions/user-setting"

import { SiteHeader } from "@/components/layouts/site-header"
import { SiteFooter } from "@/components/layouts/site-footer"

import { syncCurrentUser } from "@/lib/syncUser"

interface LobyLayoutProps {
  children: ReactNode
  modal: ReactNode
}

export default async function LobyLayout({ children, modal }: LobyLayoutProps) {
  await syncCurrentUser()
  const user = await getCachedUser()
  const userSettings = user
    ? await getCreateUserSetting(user.id)
    : null

  return (
    <div className="relative flex min-h-screen flex-col">
      <SiteHeader user={user} userSettings={userSettings} />
      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
