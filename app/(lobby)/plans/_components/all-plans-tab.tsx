// app/(lobby)/plans/_components/all-plans-tab.tsx
"use client";

import type { SpendingPlan } from "@/types";
import { PlanCard } from "./plan-card";

interface AllPlansTabProps {
  plans: SpendingPlan[];
  onTogglePin: (planId: string, pinned: boolean) => void;
}

export function AllPlansTab({ plans, onTogglePin }: AllPlansTabProps) {
  const sorted = [...plans].sort((a, b) => {
    // Năm mới → cũ, tháng mới → cũ
    if (a.period.year !== b.period.year) return b.period.year - a.period.year;
    const aMonth = a.period.month ?? 0;
    const bMonth = b.period.month ?? 0;
    if (aMonth !== bMonth) return bMonth - aMonth;
    const aWeek = a.period.weekOfYear ?? 0;
    const bWeek = b.period.weekOfYear ?? 0;
    return bWeek - aWeek;
  });

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onTogglePin={onTogglePin} />
        ))}
      </div>

      {sorted.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Chưa có kế hoạch nào.
        </p>
      )}
    </div>
  );
}
