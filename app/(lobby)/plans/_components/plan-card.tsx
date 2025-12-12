// app/(lobby)/plans/_components/plan-card.tsx
"use client";

import type { SpendingPlan } from "@/types";
import { cn } from "@/lib/utils";

interface PlanCardProps {
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

export function PlanCard({ plan, onTogglePin }: PlanCardProps) {
  const remaining = plan.totalBudget - plan.actualSpending;
  const left = daysLeft(plan.endDate);
  const isExpiringSoon = left >= 0 && left <= 7;

  // Nhận diện “kế hoạch mục tiêu dài hạn”
  const now = new Date();
  const currentYear = now.getFullYear();
  const isFutureYearGoal =
    plan.timeScale === "year" && plan.period.year > currentYear;

  const spentLabel = isFutureYearGoal ? "Đã tiết kiệm" : "Đã chi";
  const remainingLabel = isFutureYearGoal ? "Cần thêm" : "Còn lại";
  const progressLabel = isFutureYearGoal
    ? "Tiến độ tiết kiệm"
    : "Tiến độ";

  return (
    <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold leading-tight line-clamp-1">
            {plan.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {formatPlanPeriod(plan)}
          </p>
          {isFutureYearGoal && (
            <p className="mt-0.5 text-[11px] font-medium text-emerald-500">
              Kế hoạch tiết kiệm mục tiêu
            </p>
          )}
        </div>

        <button
          className={cn(
            "h-7 w-7 rounded-full border text-xs flex items-center justify-center",
            plan.pinned && "bg-primary text-primary-foreground"
          )}
          aria-label="Ghim kế hoạch"
          onClick={() => onTogglePin?.(plan.id, !plan.pinned)}
        >
          📌
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <p className="text-muted-foreground">Ngân sách</p>
          <p className="font-medium">
            {plan.totalBudget.toLocaleString("vi-VN")} ₫
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">{spentLabel}</p>
          <p className="font-medium">
            {plan.actualSpending.toLocaleString("vi-VN")} ₫
          </p>
        </div>
        <div>
          <p className="text-muted-foreground">{remainingLabel}</p>
          <p className="font-medium">
            {remaining.toLocaleString("vi-VN")} ₫
          </p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground">{progressLabel}</span>
          <span className="font-medium">
            {Math.round(plan.progressPercent)}
            %
          </span>
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
