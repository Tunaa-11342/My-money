import { getCachedUser } from '@/lib/queries/user'
import { getCacheUserSetting } from '@/lib/actions/user-setting'
import { SiteFooter } from '@/components/layouts/site-footer'
import { SiteHeader } from '@/components/layouts/site-header'

interface LobyLayoutProps
  extends React.PropsWithChildren<{
    modal: React.ReactNode
  }> {}

export default async function LobyLayout({ children }: LobyLayoutProps) {
  const user = await getCachedUser()
  const userSettings = user ? await getCacheUserSetting(user.id) : null

  return (
    <div className='relative flex min-h-screen flex-col'>
      <SiteHeader user={user} userSettings={userSettings} />
      <main className='flex-1'>
        {children}
        {/* {modal} */}
      </main>
      {/* <SiteFooter /> */}
    </div>
  )
}
