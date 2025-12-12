// app/(lobby)/plans/_components/all-plans-tab.tsx
"use client";

import type { SpendingPlan } from "@/types";
import { PlanCard } from "./plan-card";

export function AllPlansTab({
  userId,
  plans,
  onTogglePin,
}: {
  userId: string;
  plans: SpendingPlan[];
  onTogglePin: (planId: string, pinned: boolean) => void;
}) {
  const sorted = [...plans].sort((a, b) => {
    // sort newest first
    if (a.period.year !== b.period.year) return b.period.year - a.period.year;
    const aMonth = a.period.month ?? 0;
    const bMonth = b.period.month ?? 0;
    if (aMonth !== bMonth) return bMonth - aMonth;
    const aWeek = a.period.weekOfYear ?? 0;
    const bWeek = b.period.weekOfYear ?? 0;
    return bWeek - aWeek;
  });

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sorted.map((plan) => (
        <PlanCard key={plan.id} userId={userId} plan={plan} onTogglePin={onTogglePin} />
      ))}
    </div>
  );
}
