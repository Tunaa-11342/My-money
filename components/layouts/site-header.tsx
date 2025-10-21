import type { User } from '@clerk/nextjs/server'
import { UserSettings } from '@prisma/client'
import { AuthDropdown } from '@/components/layouts/auth-dropdown'
import { ModeToggle } from './mode-toggle'
import { MainNav } from './main-nav'
import { MobileNav } from './mobile-nav'
import { SpendingAlert } from './spending-alert'
import { NotificationClient } from './notification-client' // ✅ giữ lại
import { siteConfig } from '@/config/site'

interface SiteHeaderProps {
  user: User | null
  userSettings?: UserSettings | null
}

export function SiteHeader({ user, userSettings }: SiteHeaderProps) {
  return (
    <>
      <header className='sticky top-0 z-50 w-full border-b bg-background'>
        <div className='container flex h-16 items-center'>
          <MainNav items={siteConfig.mainNav} />
          <MobileNav items={siteConfig.mainNav} />
          <div className='flex flex-1 items-center justify-end space-x-4'>
            <nav className='flex items-center space-x-2'>
              {user && <NotificationClient />} {/* 🔔 */}
              <AuthDropdown user={user} />
              <ModeToggle />
            </nav>
          </div>
        </div>
      </header>

      {user && userSettings && (
        <div className='sticky top-16 z-40 w-full bg-background'>
          <div className='container py-2'>
            <SpendingAlert userSettings={userSettings} />
          </div>
        </div>
      )}
    </>
  )
}
