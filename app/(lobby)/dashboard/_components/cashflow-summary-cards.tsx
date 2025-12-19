"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { HandCoins, Wallet, PiggyBank, Receipt } from "lucide-react";

import SkeletonWrapper from "@/components/skeletons/wrapper-skeleton";
import { cn, GetFormatterForCurrency } from "@/lib/utils";
import type { UserSettings } from "@prisma/client";
import { getCashflowSummary } from "@/lib/actions/cashflow";

type Resp = Awaited<ReturnType<typeof getCashflowSummary>>;

export function CashflowSummaryCards({
  userSettings,
}: {
  userSettings: UserSettings;
}) {
  const q = useQuery<Resp>({
    queryKey: ["cashflow", "summary", userSettings.userId, 1],
    queryFn: () => getCashflowSummary(userSettings.userId, 1),
  });

  const fmt = useMemo(
    () => GetFormatterForCurrency(userSettings.currency),
    [userSettings.currency]
  );

  const monthKey = q.data?.currentMonthKey;

  const fixedIncome = q.data?.fixedIncome ?? 0;
  const actualExpense = q.data?.currentMonthActualExpense ?? 0;
  const plannedSpending = q.data?.currentMonthPlannedSpending ?? 0;

  // ✅ Còn lại theo kế hoạch = Kế hoạch chi - Chi tiêu thực tế
  const remainingToPlan = plannedSpending - actualExpense;

  const items = [
    {
      title: "Thu nhập cố định",
      value: fixedIncome,
      icon: (
        <HandCoins className="h-10 w-10 text-emerald-400 bg-emerald-400/10 rounded-xl p-2" />
      ),
      gradient: "from-emerald-400/20 to-emerald-500/10",
    },
    {
      title: `Chi tiêu thực tế${monthKey ? ` (${monthKey})` : ""}`,
      value: actualExpense,
      icon: (
        <Receipt className="h-10 w-10 text-rose-400 bg-rose-400/10 rounded-xl p-2" />
      ),
      gradient: "from-rose-400/20 to-rose-500/10",
    },
    {
      title: `Kế hoạch chi${monthKey ? ` (${monthKey})` : ""}`,
      value: plannedSpending,
      icon: (
        <Wallet className="h-10 w-10 text-violet-400 bg-violet-400/10 rounded-xl p-2" />
      ),
      gradient: "from-violet-400/20 to-indigo-500/10",
    },
    {
      title: `Còn lại theo kế hoạch${monthKey ? ` (${monthKey})` : ""}`,
      value: remainingToPlan,
      icon: (
        <PiggyBank className="h-10 w-10 text-amber-400 bg-amber-400/10 rounded-xl p-2" />
      ),
      gradient: "from-amber-400/20 to-orange-500/10",
    },
  ];

  return (
    <div className="relative w-full grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 py-4">
      {items.map((item, i) => (
        <SkeletonWrapper key={i} isLoading={q.isFetching}>
          <div
            className={cn(
              "relative overflow-hidden rounded-2xl border border-white/10 p-6",
              "transition-all duration-500 hover:scale-[1.02] hover:shadow-lg",
              "bg-[rgba(var(--card-rgb),0.55)] backdrop-blur-md",
              "before:absolute before:inset-0 before:bg-gradient-to-br before:opacity-60 before:content-['']",
              item.gradient,
              "after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.18),transparent_55%)] after:content-['']"
            )}
          >
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {item.title}
                </h3>
                {item.icon}
              </div>
              <p className="text-3xl font-bold tracking-tight">
                {fmt.format(item.value)}
              </p>
            </div>
          </div>
        </SkeletonWrapper>
      ))}
    </div>
  );
}
