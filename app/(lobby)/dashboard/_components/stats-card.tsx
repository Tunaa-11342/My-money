'use client'

import { DateToUTCDate, GetFormatterForCurrency } from '@/lib/utils'
import { UserSettings } from '@prisma/client'
import { useQuery } from '@tanstack/react-query'
import { TrendingDown, TrendingUp, Wallet } from 'lucide-react'
import React, { useMemo } from 'react'
import SkeletonWrapper from '@/components/skeletons/wrapper-skeleton'
import { getBalanceStats } from '@/lib/actions/transactions'
import { StatCard } from './stat-card'
import { cn } from '@/lib/utils'

interface Props {
  from: Date
  to: Date
  userSettings: UserSettings
}

type GetBalanceStatsResponseType = Awaited<ReturnType<typeof getBalanceStats>>

function StatsCards({ from, to, userSettings }: Props) {
  const statsQuery = useQuery<GetBalanceStatsResponseType>({
    queryKey: ['overview', 'stats', from, to],
    queryFn: () => getBalanceStats(userSettings.userId, DateToUTCDate(from), DateToUTCDate(to)),
  })

  const formatter = useMemo(() => {
    return GetFormatterForCurrency(userSettings.currency)
  }, [userSettings.currency])

  const income = statsQuery.data?.income || 0
  const expense = statsQuery.data?.expense || 0
  const balance = income - expense

  return (
    <div className="relative w-full grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
      {[
        {
          title: 'Thu nhập',
          value: income,
          icon: (
            <TrendingUp className="h-10 w-10 text-emerald-400 bg-emerald-400/10 rounded-xl p-2" />
          ),
          gradient: 'from-emerald-400/20 to-emerald-500/10',
        },
        {
          title: 'Chi tiêu',
          value: expense,
          icon: (
            <TrendingDown className="h-10 w-10 text-rose-400 bg-rose-400/10 rounded-xl p-2" />
          ),
          gradient: 'from-rose-400/20 to-rose-500/10',
        },
        {
          title: 'Số dư',
          value: balance,
          icon: <Wallet className="h-10 w-10 text-violet-400 bg-violet-400/10 rounded-xl p-2" />,
          gradient: 'from-violet-400/20 to-indigo-500/10',
        },
      ].map((item, i) => (
        <SkeletonWrapper key={i} isLoading={statsQuery.isFetching}>
          <div
            className={cn(
              'relative overflow-hidden rounded-2xl border border-white/10 bg-card/50 backdrop-blur-md p-6 transition-all duration-500 hover:scale-[1.03] hover:shadow-lg',
              'hover:border-indigo-400/30 hover:shadow-indigo-500/10'
            )}
          >
            <div
              className={cn(
                'absolute inset-0 -z-10 opacity-70 blur-2xl bg-gradient-to-br',
                item.gradient
              )}
            />
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">{item.title}</h3>
              {item.icon}
            </div>

            <p className="text-3xl font-bold tracking-tight">
              {formatter.format(item.value)}
            </p>
          </div>
        </SkeletonWrapper>
      ))}
    </div>
  )
}

export default StatsCards
