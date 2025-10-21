"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "sonner"

interface InviteMemberDialogProps {
  inviteCode: string
}

export function InviteMemberDialog({ inviteCode }: InviteMemberDialogProps) {
  const inviteLink =
    typeof window !== "undefined"
      ? `${window.location.origin}/join/${inviteCode}`
      : ""

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          + Mời thành viên
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mời thành viên</DialogTitle>
          <DialogDescription>
            Gửi mã dưới đây cho bạn bè để họ tham gia nhóm này.
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-2">
          <Input value={inviteCode ?? "Chưa có mã"} readOnly className="font-mono" />
          <Button
            variant="outline"
            onClick={() => {
              navigator.clipboard.writeText(inviteCode)
              toast.success("Đã sao chép mã nhóm!")
            }}
          >
            📋 Sao chép
          </Button>
        </div>

        <p className="text-sm text-muted-foreground mt-2">
          Hoặc chia sẻ đường dẫn:
          <span className="text-blue-600 break-all ml-1">
            {inviteLink}
          </span>
        </p>

        {/* 🧩 Mã QR tự động */}
        <div className="flex justify-center mt-4">
          <img
            src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(
              inviteLink
            )}&size=160x160`}
            alt="QR Code"
            className="rounded-md border"
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}
