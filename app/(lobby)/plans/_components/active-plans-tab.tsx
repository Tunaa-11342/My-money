// app/(lobby)/plans/_components/active-plans-tab.tsx
"use client";

import type { SpendingPlan } from "@/types";
import { PlanCard } from "./plan-card";

interface ActivePlansTabProps {
  plans: SpendingPlan[];
  onTogglePin: (planId: string, pinned: boolean) => void;
}

export function ActivePlansTab({ plans, onTogglePin }: ActivePlansTabProps) {
  const sorted = [...plans].sort((a, b) => {
    // ưu tiên theo year, rồi month, rồi week
    if (a.period.year !== b.period.year) return a.period.year - b.period.year;
    const aMonth = a.period.month ?? 0;
    const bMonth = b.period.month ?? 0;
    if (aMonth !== bMonth) return aMonth - bMonth;
    const aWeek = a.period.weekOfYear ?? 0;
    const bWeek = b.period.weekOfYear ?? 0;
    return aWeek - bWeek;
  });

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((plan) => (
          <PlanCard key={plan.id} plan={plan} onTogglePin={onTogglePin} />
        ))}
      </div>

      {sorted.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Không có kế hoạch nào đang thực hiện.
        </p>
      )}
    </div>
  );
}
