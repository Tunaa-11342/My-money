'use client'

import { useQuery } from '@tanstack/react-query'
import { SpendingNotification } from './spending-notification'
import { getCurrentMonthSpending } from '@/lib/actions/user-setting'
import { UserSettings } from '@prisma/client'
import { useEffect } from 'react'

interface SpendingAlertProps {
  userSettings: UserSettings
}

export function SpendingAlert({ userSettings }: SpendingAlertProps) {
  const spendingQuery = useQuery({
    queryKey: ['currentMonthSpending', userSettings.userId],
    queryFn: () => getCurrentMonthSpending(userSettings.userId),
    refetchInterval: 5 * 60 * 1000, 
  })

  const currentSpending = spendingQuery.data || 0
  const monthlyBudget = userSettings.monthlyBudget || 0
  const percentage = monthlyBudget > 0 ? (currentSpending / monthlyBudget) * 100 : 0

  useEffect(() => {
    if (!monthlyBudget) return
    if (percentage < 90) return

    const sendNotification = async () => {
      const res = await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message:
            percentage >= 100
              ? `⚠️ Ngân sách tháng này đã vượt giới hạn ${monthlyBudget.toLocaleString()} VND!`
              : `Ngân sách tháng này đã đạt ${percentage.toFixed(1)}%. Hãy kiểm soát chi tiêu!`,
        }),
      })
      if (!res.ok) console.error('Không thể gửi thông báo.')
    }

    sendNotification()
  }, [percentage, monthlyBudget])

  if (spendingQuery.isLoading || !spendingQuery.data) {
    return null
  }

  return (
    <SpendingNotification
      currentSpending={currentSpending}
      monthlyBudget={monthlyBudget}
      currency={userSettings.currency}
    />
  )
}
