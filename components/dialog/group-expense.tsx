'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"


interface AddExpenseDialogProps {
  groupId: string
}

interface Member {
  id: string
  userId: string
  role: string
  user?: {
    id: string
    name: string | null
    imageUrl: string | null
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  food: "🍜 Ăn uống",
  transport: "🚌 Di chuyển",
  shopping: "🛍️ Mua sắm",
  entertainment: "🎮 Giải trí",
  other: "📦 Khác",
}

export function AddExpenseDialog({ groupId }: AddExpenseDialogProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [members, setMembers] = useState<Member[]>([])

  const [form, setForm] = useState({
    name: '',
    amount: 0,
    date: new Date(),
    payerId: '',
    categoryName: '',
    note: '',
  })

  useEffect(() => {
    const fetchMembers = async () => {
      const res = await fetch(`/api/groups/${groupId}`)
      if (res.ok) {
        const data = await res.json()
        setMembers(data.memberships || [])
      }
    }
    fetchMembers()
  }, [groupId])

  const handleSubmit = async () => {
    if (!form.name.trim() || form.amount <= 0 || !form.payerId || !form.categoryName) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc.')
      return
    }

    setError('')
    setLoading(true)

    const res = await fetch(`/api/groups/${groupId}/expenses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    const data = await res.json()

    if (res.ok) {
      setOpen(false)
      window.location.reload()
    } else {
      setError(data.error || 'Thêm khoản chi thất bại.')
    }

    setLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full">+ Thêm khoản chi</Button>
      </DialogTrigger>

      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm khoản chi mới</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tên khoản chi */}
          <div>
            <Label>Tên khoản chi *</Label>
            <Input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nhập tên khoản chi..."
            />
          </div>

          {/* Số tiền */}
          <div>
            <Label>Số tiền (VNĐ) *</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })}
              placeholder="0"
            />
          </div>

          {/* Ngày chi */}
          <div className="flex flex-col space-y-1">
            <Label>Ngày chi</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="justify-start w-full text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {form.date ? format(form.date, 'dd/MM/yyyy', { locale: vi }) : 'Chọn ngày'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="p-0" align="start">
                <Calendar
                  mode="single"
                  selected={form.date}
                  onSelect={(date) => date && setForm({ ...form, date })}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Người chi */}
<div>
  <Label>Người chi *</Label>
  <Select
    onValueChange={(v) => setForm({ ...form, payerId: v })}
    defaultValue={form.payerId}
  >
    <SelectTrigger>
      <SelectValue placeholder="Chọn thành viên" />
    </SelectTrigger>

    <SelectContent>
      {members.length === 0 ? (
        <SelectItem value="none" disabled>
          Chưa có thành viên
        </SelectItem>
      ) : (
        members.map((m) => (
          <SelectItem key={m.id} value={m.userId}>
            <div className="flex items-center gap-2">
              <Avatar className="size-6">
                <AvatarImage
                  src={m.user?.imageUrl || undefined}
                  alt={m.user?.name ?? ""}
                />
                <AvatarFallback seed={m.userId} />
              </Avatar>
              <span>{m.user?.name ?? "Người dùng ẩn danh"}</span>
            </div>
          </SelectItem>
        ))
      )}
    </SelectContent>
  </Select>
</div>

          {/* Danh mục */}
          <div>
            <Label>Danh mục *</Label>
            <Select
              onValueChange={(v) => setForm({ ...form, categoryName: v })}
              defaultValue={form.categoryName}
            >
              <SelectTrigger>
                <SelectValue placeholder="Chọn danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="food">🍜 Ăn uống</SelectItem>
                <SelectItem value="transport">🚌 Đi lại</SelectItem>
                <SelectItem value="shopping">🛍️ Mua sắm</SelectItem>
                <SelectItem value="entertainment">🎮 Giải trí</SelectItem>
                <SelectItem value="other">💡 Khác</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Ghi chú */}
          <div>
            <Label>Ghi chú</Label>
            <Textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Nhập ghi chú..."
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? 'Đang thêm...' : 'Thêm khoản chi'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
