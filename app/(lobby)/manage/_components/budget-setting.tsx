'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateUserBudget } from '@/lib/actions/user-setting'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

interface BudgetSettingProps {
  userId: string
  currentBudget: number
  currency: string
}

export function BudgetSetting({ userId, currentBudget, currency }: BudgetSettingProps) {
  const [budget, setBudget] = useState(currentBudget.toString())
  const [isLoading, setIsLoading] = useState(false)
  const queryClient = useQueryClient()

  // 🧩 Gửi thông báo nếu ngân sách hiện tại sắp vượt
  useEffect(() => {
    const checkAndNotify = async () => {
      const budgetValue = parseFloat(budget)
      if (!budgetValue || isNaN(budgetValue)) return

      const percentage = (currentBudget / budgetValue) * 100
      if (percentage < 90) return // chỉ báo khi đạt 90% trở lên

      const message =
        percentage >= 100
          ? `⚠️ Ngân sách hiện tại (${currentBudget.toLocaleString()} VND) đã vượt giới hạn ${budgetValue.toLocaleString()} VND!`
          : `Ngân sách tháng này đã đạt ${percentage.toFixed(1)}%. Hãy kiểm soát chi tiêu!`

      try {
        const res = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message }),
        })
        if (!res.ok) console.error('Không thể gửi thông báo.')
      } catch (err) {
        console.error('Lỗi khi gửi thông báo:', err)
      }
    }

    checkAndNotify()
  }, [currentBudget, budget])

  const handleSave = async () => {
    setIsLoading(true)
    try {
      const budgetValue = parseFloat(budget)
      if (isNaN(budgetValue) || budgetValue < 0) {
        toast.error('Vui lòng nhập số tiền hợp lệ')
        return
      }

      await updateUserBudget(userId, budgetValue)
      toast.success('Đã cập nhật ngân sách hàng tháng')

      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['userSettings'] })
      queryClient.invalidateQueries({ queryKey: ['currentMonthSpending'] })
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật ngân sách')
      console.error(error)
    } finally {
      setIsLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: currency,
    }).format(amount)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ngân sách hàng tháng</CardTitle>
        <CardDescription>
          Đặt giới hạn chi tiêu hàng tháng để nhận thông báo khi sắp vượt quá ngân sách
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="budget">Ngân sách hàng tháng</Label>
          <div className="flex items-center space-x-2">
            <Input
              id="budget"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Nhập số tiền..."
              min="0"
              step="1000"
            />
            <span className="text-sm text-muted-foreground">{currency}</span>
          </div>
          {currentBudget > 0 && (
            <p className="text-sm text-muted-foreground">
              Ngân sách hiện tại: {formatCurrency(currentBudget)}
            </p>
          )}
        </div>
        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? 'Đang lưu...' : 'Lưu ngân sách'}
        </Button>
      </CardContent>
    </Card>
  )
}
