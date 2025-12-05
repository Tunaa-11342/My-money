import { PiggyBank } from 'lucide-react'
import React from 'react'

interface LogoProps {
  className?: string
}

function Logo({ className }: LogoProps) {
  return (
    <a href='/' className={`flex items-center gap-2 ${className ?? ""}`}>
      <PiggyBank className='h-14 w-14 text-indigo-600 dark:text-indigo-400' />
      <p className='animate-fade-up bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent text-3xl font-bold leading-tight tracking-tighter'>
        Trình theo dõi ngân sách
      </p>
    </a>
  )
}

export function LogoMobile({ className }: LogoProps) {
  return (
    <a href='/' className={`flex items-center gap-2 ${className ?? ""}`}>
      <p className='animate-fade-up bg-gradient-to-r from-indigo-600 via-purple-500 to-pink-500 bg-clip-text text-transparent text-3xl font-bold leading-tight tracking-tighter'>
        Trình theo dõi ngân sách
      </p>
    </a>
  )
}

export default Logo
