'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function JoinGroupDialog() {
  const [open, setOpen] = useState(false)
  const [groupId, setGroupId] = useState('')

  const handleJoin = async () => {
    await fetch('/api/groups/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId }),
    })
    setOpen(false)
    window.location.reload()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Tham gia nhóm</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nhập ID nhóm để tham gia</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Input value={groupId} onChange={(e) => setGroupId(e.target.value)} placeholder="Nhập ID nhóm..." />
          <Button onClick={handleJoin}>Tham gia</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
