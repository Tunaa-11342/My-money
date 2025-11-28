"use client";

import { useQuery } from "@tanstack/react-query";
import { SpendingNotification } from "./spending-notification";
import { getCurrentMonthSpending } from "@/lib/actions/user-setting";
import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";

export function SpendingAlert() {
  const { user } = useUser();
  const userId = user?.id;

  const spendingQuery = useQuery({
    queryKey: ["currentMonthSpending", userId],
    queryFn: () => getCurrentMonthSpending(userId!),
    enabled: !!userId,
    refetchInterval: 5 * 60 * 1000,
  });

  const data = spendingQuery.data;
  const currentSpending = data?.currentSpending ?? 0;
  const monthlyBudget = data?.monthlyBudget ?? 0;
  const currency = data?.currency ?? "VND";
  const percentage =
    monthlyBudget > 0 ? (currentSpending / monthlyBudget) * 100 : 0;

  useEffect(() => {
    if (!monthlyBudget || percentage < 90) return;

    const sendNotification = async () => {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:
            percentage >= 100
              ? `⚠️ Bạn đã vượt ngân sách tháng (${monthlyBudget.toLocaleString()} VND)!`
              : `⚠️ Chi tiêu đã đạt ${percentage.toFixed(
                  1
                )}% ngân sách (${monthlyBudget.toLocaleString()} VND).`,
        }),
      });
      window.dispatchEvent(new Event("new-notification"));
    };

    sendNotification();
  }, [percentage, monthlyBudget]);

  if (!userId || spendingQuery.isLoading) {
    return null;
  }

  return (
    <SpendingNotification
      currentSpending={currentSpending}
      monthlyBudget={monthlyBudget}
      currency={currency}
    />
  );
}
