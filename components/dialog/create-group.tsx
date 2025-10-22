'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

export function CreateGroupDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    budget: 0,
    periodDays: 5,
    isPrivate: false,
  })

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      setError('Tên nhóm không được để trống.')
      return
    }

    setError('')
    setLoading(true)

    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (res.ok) {
        setOpen(false)
        window.location.reload()
      } else {
        setError(data.error || 'Tạo nhóm thất bại, vui lòng thử lại.')
      }
    } catch {
      setError('Lỗi kết nối máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Tạo nhóm</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo nhóm chi tiêu</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Tên nhóm */}
          <div>
            <Label>Tên nhóm</Label>
            <Input
              value={form.name}
              onChange={(e) =>
                setForm({ ...form, name: e.target.value })
              }
              placeholder="Nhập tên nhóm..."
            />
            {error && (
              <p className="text-red-500 text-sm mt-1">{error}</p>
            )}
          </div>

          {/* Ngân sách */}
          <div>
            <Label>Ngân sách (VNĐ)</Label>
            <Input
              type="number"
              value={form.budget}
              onChange={(e) =>
                setForm({ ...form, budget: Number(e.target.value) })
              }
            />
          </div>

          {/* Chu kỳ */}
          <div>
            <Label>Chu kỳ (ngày)</Label>
            <Input
              type="number"
              value={form.periodDays}
              onChange={(e) =>
                setForm({ ...form, periodDays: Number(e.target.value) })
              }
            />
          </div>

          {/* Riêng tư */}
          <div className="flex items-center justify-between">
            <Label>Chế độ riêng tư</Label>
            <Switch
              checked={form.isPrivate}
              onCheckedChange={(val) =>
                setForm({ ...form, isPrivate: val })
              }
            />
          </div>

          {/* Nút submit */}
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Đang tạo...' : 'Tạo nhóm'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
