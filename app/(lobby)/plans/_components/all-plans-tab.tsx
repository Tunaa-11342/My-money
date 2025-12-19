"use client";

import type { SpendingPlan } from "@/types";
import { Wallet } from "lucide-react";

import { CreatePlanDialog } from "@/components/dialog/create-plan-dialog";
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
    if (a.period.year !== b.period.year) return b.period.year - a.period.year;
    const aMonth = a.period.month ?? 0;
    const bMonth = b.period.month ?? 0;
    if (aMonth !== bMonth) return bMonth - aMonth;
    const aWeek = a.period.weekOfYear ?? 0;
    const bWeek = b.period.weekOfYear ?? 0;
    return bWeek - aWeek;
  });

  if (sorted.length === 0) {
    return (
      <div className="relative overflow-hidden rounded-xl border bg-card p-6">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/20 blur-3xl opacity-60" />
        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/30">
                <Wallet className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="text-lg font-semibold">Chưa có kế hoạch nào</div>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              Tạo kế hoạch đầu tiên để bắt đầu theo dõi và ghim lên Dashboard.
            </p>
          </div>

          <CreatePlanDialog userId={userId} triggerVariant="primary" triggerText="Tạo kế hoạch" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {sorted.map((plan) => (
        <PlanCard key={plan.id} userId={userId} plan={plan} onTogglePin={onTogglePin} />
      ))}
    </div>
  );
}
