// app/(lobby)/dashboard/_components/planned-spending-dashboard-widget.tsx
"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Pin } from "lucide-react";

import SkeletonWrapper from "@/components/skeletons/wrapper-skeleton";
import { getPinnedPlansForDashboard } from "@/lib/actions/planned-spending";
import { PlanCard } from "@/app/(lobby)/plans/_components/plan-card";
import type { UserSettings } from "@prisma/client";

interface PlannedSpendingDashboardWidgetProps {
  userSettings: UserSettings;
}

export function PlannedSpendingDashboardWidget({
  userSettings,
}: PlannedSpendingDashboardWidgetProps) {
  const userId = userSettings.userId;

  const { data, isFetching } = useQuery({
    queryKey: ["dashboard", "pinnedPlans", userId],
    queryFn: () => getPinnedPlansForDashboard(userId),
  });

  const plans = data ?? [];

  return (
    <div className="rounded-2xl border border-dashed border-indigo-200/40 bg-gradient-to-br from-indigo-500/5 to-violet-500/5 p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Pin className="h-4 w-4 text-indigo-500" />
          <h3 className="text-sm font-semibold">Kế hoạch đang ghim</h3>
        </div>
        <span className="text-xs text-muted-foreground">
          Chỉ hiển thị kế hoạch tuần / tháng hiện tại
        </span>
      </div>

      <SkeletonWrapper isLoading={isFetching}>
        {plans.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl bg-card/40 p-6 text-center text-sm text-muted-foreground">
            <AlertCircle className="mb-2 h-5 w-5 text-indigo-400" />
            <p>Chưa có kế hoạch nào được ghim cho kỳ hiện tại.</p>
            <p className="mt-1 text-xs">
              Vào tab <span className="font-semibold">Kế hoạch</span> để ghim các kế hoạch quan trọng.
            </p>
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-1 xl:grid-cols-1 2xl:grid-cols-1">
            {plans.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        )}
      </SkeletonWrapper>
    </div>
  );
}
