"use client";

import type { SavingGoalPlan } from "@/types";
import { cn } from "@/lib/utils";
import { Progress } from "@/components/ui/progress";
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
import { useState } from "react";

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN").format(n);
}

export function SavingGoalCard({
  goal,
  onTogglePin,
  onDelete,
}: {
  goal: SavingGoalPlan;
  onTogglePin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);
  const progress = goal.targetAmount <= 0 ? 0 : Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);

return (
  <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold leading-tight line-clamp-1">
            {goal.title}
          </h3>

          <Badge variant="secondary">Tiết kiệm</Badge>
          {goal.pinned && <Badge>Ghim</Badge>}
        </div>

        <p className="mt-0.5 text-xs text-muted-foreground">
          Mục tiêu: {fmt(goal.targetAmount)} • Đã tiết kiệm:{" "}
          {fmt(goal.currentAmount)}
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
              onClick={() => onTogglePin(goal.id, !goal.pinned)}
            >
              {goal.pinned ? (
                <PinOff className="mr-2 h-4 w-4" />
              ) : (
                <Pin className="mr-2 h-4 w-4" />
              )}
              {goal.pinned ? "Bỏ ghim" : "Ghim lên dashboard"}
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
              <AlertDialogTitle>Xóa mục tiêu?</AlertDialogTitle>
              <AlertDialogDescription>
                Hành động này không thể hoàn tác.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={() => onDelete(goal.id)}
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
        <p className="text-muted-foreground">Mục tiêu</p>
        <p className="font-medium">{fmt(goal.targetAmount)} ₫</p>
      </div>
      <div>
        <p className="text-muted-foreground">Đã tiết kiệm</p>
        <p className="font-medium">{fmt(goal.currentAmount)} ₫</p>
      </div>
      <div>
        <p className="text-muted-foreground">Còn thiếu</p>
        <p className="font-medium">{fmt(remaining)} ₫</p>
      </div>
    </div>

    {/* Progress */}
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">Tiến độ</span>
        <span className="font-medium">{Math.round(progress)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className="h-1.5 rounded-full bg-primary"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
    </div>

    {/* Footer */}
    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>Mục tiêu tiết kiệm</span>
      <span>Còn {fmt(remaining)} ₫</span>
    </div>
  </div>
);

}
