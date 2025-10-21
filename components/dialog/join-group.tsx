"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { QRScanner } from "@/components/dialog/qr-scanner"

export function JoinGroupDialog() {
  const [open, setOpen] = useState(false)
  const [inviteCode, setInviteCode] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleJoin = async (code: string) => {
    if (!code.trim()) {
      toast.error("Vui lòng nhập mã nhóm")
      return
    }

    try {
      setLoading(true)

      const baseUrl =
        typeof window !== "undefined"
          ? window.location.origin
          : process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"

      const res = await fetch(`${baseUrl}/api/groups/join/${code}`, {
        method: "POST",
      })

      const data = await res.json()

      if (data.success) {
        toast.success(data.message)
        setOpen(false)
        router.push(`/group/${data.groupId}`)
      } else {
        toast.error(data.error || data.message || "Không thể tham gia nhóm")
      }
    } catch (err) {
      console.error(err)
      toast.error("Lỗi kết nối đến máy chủ")
    } finally {
      setLoading(false)
    }
  }

  const handleScan = (result: any) => {
    if (result?.text) {
      const match = result.text.match(/join\/([\w-]+)/)
      if (match) handleJoin(match[1])
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">Tham gia nhóm</Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tham gia nhóm</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="manual" className="w-full mt-3">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="qr">📷 Quét QR</TabsTrigger>
            <TabsTrigger value="manual">⌨️ Nhập mã</TabsTrigger>
          </TabsList>

          <TabsContent value="qr" className="mt-4 space-y-4">
            <QRScanner onResult={(result) => handleJoin(result)} />
            <p className="text-center text-sm text-muted-foreground">
              Hướng camera vào mã QR để tham gia nhóm.
            </p>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4 mt-4">
            <Input
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              placeholder="Nhập mã nhóm (ví dụ: A1B2C3)"
            />
            <Button
              onClick={() => handleJoin(inviteCode)}
              disabled={loading}
              className="w-full"
            >
              {loading ? "Đang tham gia..." : "Tham gia"}
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
