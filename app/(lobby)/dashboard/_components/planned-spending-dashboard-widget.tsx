// app/(lobby)/dashboard/_components/planned-spending-dashboard-widget.tsx
"use client";

import React from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, ChevronRight, Pin } from "lucide-react";

import SkeletonWrapper from "@/components/skeletons/wrapper-skeleton";
import { getPinnedPlansForDashboard } from "@/lib/actions/planned-spending";
import { cn, GetFormatterForCurrency } from "@/lib/utils";
import type { SpendingPlan } from "@/types";
import type { UserSettings } from "@prisma/client";

interface PlannedSpendingDashboardWidgetProps {
  userSettings: UserSettings;
}

/**
 * Format cực gọn kiểu VN:
 *  - 1_200 -> 1,2k
 *  - 1_200_000 -> 1,2tr
 *  - 1_200_000_000 -> 1,2tỷ
 */
function formatCompactVND(value: number) {
  const abs = Math.abs(value);
  const sign = value < 0 ? "-" : "";

  const to1 = (n: number) =>
    n
      .toFixed(1)
      .replace(/\.0$/, "")
      .replace(".", ",");

  if (abs >= 1_000_000_000) return `${sign}${to1(abs / 1_000_000_000)}tỷ`;
  if (abs >= 1_000_000) return `${sign}${to1(abs / 1_000_000)}tr`;
  if (abs >= 1_000) return `${sign}${to1(abs / 1_000)}k`;
  return `${sign}${abs.toLocaleString("vi-VN")}`;
}

function formatMoneyShort(
  value: number,
  currency: string,
  fullFormatter: Intl.NumberFormat
) {
  if (currency === "VND") return formatCompactVND(value);

  // fallback: để chính xác, vẫn dùng formatter chuẩn currency
  // (ít gọn hơn nhưng an toàn cho currency khác)
  return fullFormatter.format(value);
}

function PinnedPlanRow({
  plan,
  currency,
  formatter,
}: {
  plan: SpendingPlan;
  currency: string;
  formatter: Intl.NumberFormat;
}) {
  const raw = Number.isFinite(plan.progressPercent) ? plan.progressPercent : 0;
  const percent = Math.max(0, Math.round(raw));
  const fill = Math.max(0, Math.min(100, raw));
  const isOver = percent > 100;

  const spent = plan.actualSpending ?? 0;
  const total = plan.totalBudget ?? 0;

  const pillCls = isOver
    ? "bg-rose-500/15 text-rose-500 border-rose-500/25"
    : "bg-indigo-500/15 text-indigo-500 border-indigo-500/25";

  const fillCls = isOver ? "bg-rose-500/10" : "bg-indigo-500/10";

  const right =
    currency === "VND"
      ? `${formatMoneyShort(spent, currency, formatter)}/${formatMoneyShort(
          total,
          currency,
          formatter
        )}`
      : `${formatter.format(spent)} / ${formatter.format(total)}`;

  return (
    <div
      className={cn(
        "group relative z-0 overflow-hidden rounded-xl border border-white/10 bg-background/40 px-3 py-2",
        "transition-colors hover:bg-background/60",
        isOver ? "hover:border-rose-200/25" : "hover:border-indigo-200/25"
      )}
      title={`${formatter.format(spent)} / ${formatter.format(total)}`}
    >
      {/* progress fill nền mờ (đẹp nhưng vẫn 1 dòng) */}
      <div className="absolute inset-0 -z-10">
        <div className={cn("h-full", fillCls)} style={{ width: `${fill}%` }} />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold leading-tight">
            {plan.name}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 whitespace-nowrap">
          <span
            className={cn(
              "rounded-full border px-2 py-0.5 text-[11px] font-semibold tabular-nums",
              pillCls
            )}
          >
            {percent}%
          </span>

          <span className="text-[11px] text-muted-foreground tabular-nums">
            {right}
          </span>
        </div>
      </div>
    </div>
  );
}

export function PlannedSpendingDashboardWidget({
  userSettings,
}: PlannedSpendingDashboardWidgetProps) {
  const userId = userSettings.userId;
  const currency = userSettings.currency ?? "VND";

  const formatter = React.useMemo(
    () => GetFormatterForCurrency(currency),
    [currency]
  );

  const { data, isFetching } = useQuery<SpendingPlan[]>({
    queryKey: ["dashboard", "pinnedPlans", userId],
    queryFn: () => getPinnedPlansForDashboard(userId),
  });

  const plans = data ?? [];

  return (
    <div className="rounded-2xl border border-dashed border-indigo-200/40 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/10 bg-background/40">
            <Pin className="h-4 w-4 text-indigo-500" />
          </div>

          <h3 className="truncate text-sm font-semibold">Kế hoạch đang ghim</h3>

          {plans.length > 0 && (
            <span className="rounded-full bg-indigo-500/10 px-2 py-0.5 text-[11px] font-medium text-indigo-300">
              {plans.length}
            </span>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span
            className="hidden text-xs text-muted-foreground sm:inline"
            title="Tuần / Tháng / Quý / Năm hiện tại"
          >
            Kỳ hiện tại
          </span>

          <Link
            href="/plans"
            className="group inline-flex items-center gap-1 rounded-lg border border-white/10 bg-background/40 px-2 py-1 text-xs text-muted-foreground transition hover:bg-background/60 hover:text-foreground"
          >
            Xem
            <ChevronRight className="h-4 w-4 opacity-60 transition group-hover:opacity-100" />
          </Link>
        </div>
      </div>

      <SkeletonWrapper isLoading={isFetching}>
        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-card/40 p-6 text-center text-sm text-muted-foreground">
            <AlertCircle className="mb-2 h-5 w-5 text-indigo-400" />
            <p>Chưa có kế hoạch nào được ghim cho kỳ hiện tại.</p>
            <p className="mt-1 text-xs">
              Vào tab <span className="font-semibold">Kế hoạch</span> để ghim các
              kế hoạch quan trọng.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {plans.map((plan) => (
              <PinnedPlanRow
                key={plan.id}
                plan={plan}
                currency={currency}
                formatter={formatter}
              />
            ))}
          </div>
        )}
      </SkeletonWrapper>
    </div>
  );
}
