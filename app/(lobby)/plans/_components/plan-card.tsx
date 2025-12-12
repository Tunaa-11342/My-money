"use client";

import type { SpendingPlan } from "@/types";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Trash2, Pin, PinOff } from "lucide-react";

import { deletePlannedSpending } from "@/lib/actions/planned-spending";

interface PlanCardProps {
  userId: string;
  plan: SpendingPlan;
  onTogglePin?: (planId: string, pinned: boolean) => void;
}

function daysLeft(dateStr: string) {
  const today = new Date();
  const end = new Date(dateStr);
  const diff = end.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function formatPlanPeriod(plan: SpendingPlan) {
  const { year, quarter, month, weekOfYear } = plan.period;
  if (plan.timeScale === "year") return `Năm ${year}`;
  if (plan.timeScale === "quarter") return `Quý ${quarter} - ${year}`;
  if (plan.timeScale === "month") return `Tháng ${month}/${year}`;
  if (plan.timeScale === "week") return `Tuần ${weekOfYear} - ${year}`;
  return `${year}`;
}

export function PlanCard({ userId, plan, onTogglePin }: PlanCardProps) {
  const queryClient = useQueryClient();
  const [openDelete, setOpenDelete] = useState(false);

  const remaining = plan.totalBudget - plan.actualSpending;
  const left = daysLeft(plan.endDate);
  const isExpiringSoon = left >= 0 && left <= 7;

  // Nhận diện “kế hoạch mục tiêu dài hạn”
  const now = new Date();
  const currentYear = now.getFullYear();
  const isFutureYearGoal = plan.timeScale === "year" && plan.period.year > currentYear;

  const spentLabel = isFutureYearGoal ? "Đã tiết kiệm" : "Đã chi";
  const remainingLabel = isFutureYearGoal ? "Cần thêm" : "Còn lại";
  const progressLabel = isFutureYearGoal ? "Tiến độ tiết kiệm" : "Tiến độ";

  const handleDelete = async () => {
    try {
      toast.loading("Đang xóa kế hoạch...", { id: plan.id });

      await deletePlannedSpending(userId, plan.id);

      toast.success("Đã xóa kế hoạch", { id: plan.id });
      setOpenDelete(false);

      // invalidate đúng queryKey mà PlansView đang dùng
      await queryClient.invalidateQueries({ queryKey: ["spending-plans", userId] });
      // và widget dashboard nếu cần (nếu m đang show pinned)
      await queryClient.invalidateQueries({ queryKey: ["dashboard", "pinnedPlans", userId] });
    } catch (e: any) {
      toast.error(e?.message ?? "Không xóa được kế hoạch", { id: plan.id });
    }
  };

return (
  <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
    <div className="flex items-start justify-between gap-2">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold leading-tight line-clamp-1">{plan.name}</h3>

          {/* Badge "Ghim" khi đã ghim */}
          {plan.pinned && <Badge>Ghim</Badge>}
        </div>

        <p className="text-xs text-muted-foreground">{formatPlanPeriod(plan)}</p>

        {isFutureYearGoal && (
          <p className="mt-0.5 text-[11px] font-medium text-emerald-500">
            Kế hoạch tiết kiệm mục tiêu
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        {/* More actions */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end">
            {!!onTogglePin && (
              <DropdownMenuItem onClick={() => onTogglePin(plan.id, !plan.pinned)}>
                {plan.pinned ? (
                  <PinOff className="mr-2 h-4 w-4" />
                ) : (
                  <Pin className="mr-2 h-4 w-4" />
                )}
                {plan.pinned ? "Bỏ ghim" : "Ghim lên dashboard"}
              </DropdownMenuItem>
            )}

            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => setOpenDelete(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Xóa kế hoạch
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Confirm delete (đặt ngoài DropdownMenu cho sạch structure) */}
        <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Xóa kế hoạch?</AlertDialogTitle>
              <AlertDialogDescription>
                Thao tác này không thể hoàn tác. Kế hoạch sẽ bị xóa vĩnh viễn.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Hủy</AlertDialogCancel>
              <AlertDialogAction
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                onClick={handleDelete}
              >
                Xóa
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>

    {/* Body giữ nguyên */}
    <div className="grid grid-cols-3 gap-2 text-xs">
      <div>
        <p className="text-muted-foreground">Ngân sách</p>
        <p className="font-medium">{plan.totalBudget.toLocaleString("vi-VN")} ₫</p>
      </div>
      <div>
        <p className="text-muted-foreground">{spentLabel}</p>
        <p className="font-medium">{plan.actualSpending.toLocaleString("vi-VN")} ₫</p>
      </div>
      <div>
        <p className="text-muted-foreground">{remainingLabel}</p>
        <p className="font-medium">{remaining.toLocaleString("vi-VN")} ₫</p>
      </div>
    </div>

    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{progressLabel}</span>
        <span className="font-medium">{Math.round(plan.progressPercent)}%</span>
      </div>
      <div className="h-1.5 w-full rounded-full bg-muted">
        <div
          className="h-1.5 rounded-full bg-primary"
          style={{ width: `${Math.min(plan.progressPercent, 100)}%` }}
        />
      </div>
    </div>

    <div className="flex items-center justify-between text-xs text-muted-foreground">
      <span>
        {new Date(plan.startDate).toLocaleDateString("vi-VN")} -{" "}
        {new Date(plan.endDate).toLocaleDateString("vi-VN")}
      </span>
      {left < 0 ? (
        <span>Đã kết thúc</span>
      ) : (
        <span className={cn(isExpiringSoon && "text-red-500 font-medium")}>
          Còn {left} ngày
        </span>
      )}
    </div>
  </div>
);
}