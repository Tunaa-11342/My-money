'use client'

import { AlertTriangle, X } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface SpendingNotificationProps {
  currentSpending: number
  monthlyBudget: number
  currency: string
  className?: string
}

export function SpendingNotification({
  currentSpending,
  monthlyBudget,
  currency,
  className,
}: SpendingNotificationProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  if (monthlyBudget <= 0 || isDismissed) return null

  const isOverBudget = currentSpending > monthlyBudget
  const percentage = (currentSpending / monthlyBudget) * 100
  if (percentage < 90) return null

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency }).format(amount)

  return (
    <Card
      className={cn(
        'border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20',
        className
      )}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <div className="text-sm">
              <p className="font-medium text-red-800 dark:text-red-200">
                {isOverBudget ? 'Đã vượt ngân sách!' : 'Sắp vượt ngân sách!'}
              </p>
              <p className="text-red-600 dark:text-red-300">
                Đã chi: {formatCurrency(currentSpending)} /{' '}
                {formatCurrency(monthlyBudget)} ({percentage.toFixed(1)}%)
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDismissed(true)}
            className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-100 dark:hover:bg-red-900"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
