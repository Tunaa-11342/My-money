"use client";

import type { DebtPlanItem } from "@/types";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Pin, PinOff, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

function categoryLabel(c: DebtPlanItem["category"]) {
  switch (c) {
    case "COLLECT":
      return "Thu nợ";
    case "BORROW":
      return "Đi vay";
    case "LEND":
      return "Cho vay";
    case "REPAY":
      return "Trả nợ";
    default:
      return "Vay/Nợ";
  }
}

export function DebtPlanCard({
  plan,
  onTogglePin,
  onDelete,
}: {
  plan: DebtPlanItem;
  onTogglePin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const badge = useMemo(() => categoryLabel(plan.category), [plan.category]);

return (
  <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold leading-tight line-clamp-1">
            {plan.title}
          </h3>

          <Badge variant="secondary">{badge}</Badge>
          {plan.pinned && <Badge>Ghim</Badge>}
        </div>

        <p className="mt-0.5 text-xs text-muted-foreground">
          Số tiền: {fmt(plan.amount)} ₫
          {plan.notes ? <> • Ghi chú: {plan.notes}</> : null}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => onTogglePin(plan.id, !plan.pinned)}
            >
              {plan.pinned ? (
                <PinOff className="mr-2 h-4 w-4" />
              ) : (
                <Pin className="mr-2 h-4 w-4" />
              )}
              {plan.pinned ? "Bỏ ghim" : "Ghim lên dashboard"}
            </DropdownMenuItem>

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setConfirmOpen(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa khoản vay/nợ?</AlertDialogTitle>
              <AlertDialogDescription>
                Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                className={cn(
                  "bg-destructive text-destructive-foreground hover:bg-destructive/90"
                )}
                onClick={() => onDelete(plan.id)}
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
    <div className="grid grid-cols-3 gap-2 text-xs">
      <div>
        <p className="text-muted-foreground">Số tiền</p>
        <p className="font-medium">{fmt(plan.amount)} ₫</p>
      </div>
      <div>
        <p className="text-muted-foreground">Trạng thái</p>
        <p className="font-medium">{badge}</p>
      </div>
      <div>
        <p className="text-muted-foreground">Loại</p>
        <p className="font-medium">Vay / Nợ</p>
      </div>
    </div>


    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Tiến độ</span>
        <span className="font-medium">—</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div className="h-1.5 rounded-full bg-primary w-0" />
      </div>
    </div>

    {/* Footer */}
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>Khoản vay / nợ</span>
      <span>{fmt(plan.amount)} ₫</span>
    </div>
  </div>
);

}
