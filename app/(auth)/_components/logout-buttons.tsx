'use client'

import { useRouter } from 'next/navigation'
import { SignOutButton } from '@clerk/nextjs'

import { cn } from '@/lib/utils'
import { useMounted } from '@/hooks/use-mounted'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

export function LogOutButtons() {
  const router = useRouter()
  const mounted = useMounted()

  return (
    <div className='flex w-full flex-col-reverse items-center gap-2 sm:flex-row'>
      <Button variant='secondary' size='sm' className='w-full' onClick={() => router.back()}>
        Trang trước
        <span className='sr-only'>Trang trước</span>
      </Button>
      {mounted ? (
        <SignOutButton redirectUrl={`${window.location.origin}/?redirect=false`}>
          <Button size='sm' className='w-full'>
            Đăng xuất
            <span className='sr-only'>Đăng xuất</span>
          </Button>
        </SignOutButton>
      ) : (
        <Skeleton
          className={cn(buttonVariants({ size: 'sm' }), 'w-full bg-muted text-muted-foreground')}
        >
          Đăng xuất
        </Skeleton>
      )}
    </div>
  )
}
