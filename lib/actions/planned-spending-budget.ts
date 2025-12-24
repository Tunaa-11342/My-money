"use server";

import { prisma } from "@/lib/prisma";
import { PlannedPeriodType } from "@prisma/client";
import { ensureMonthlyBudget } from "@/lib/actions/monthly-budget";

export async function getPlannedSpendingSum(
  userId: string,
  monthKey: string,
  excludePlanId?: string
) {
  const planned = await prisma.plannedSpending.aggregate({
    where: {
      userId,
      periodType: PlannedPeriodType.MONTHLY,
      periodKey: monthKey,
      ...(excludePlanId ? { id: { not: excludePlanId } } : {}),
    },
    _sum: { targetAmount: true },
  });

  return Number(planned?._sum?.targetAmount ?? 0);
}

export async function validatePlanAgainstMonthlyBudget(params: {
  userId: string;
  monthKey: string;   
  planAmount: number;
  excludePlanId?: string;
}) {
  const budget = await ensureMonthlyBudget(params.userId, params.monthKey);

  const plannedSum = await getPlannedSpendingSum(
    params.userId,
    params.monthKey,
    params.excludePlanId
  );

  const totalBudget = Number(budget.totalBudget);
  const nextPlannedTotal = plannedSum + Number(params.planAmount ?? 0);

  const remainingForPlans = totalBudget - plannedSum;
  const overBy = Math.max(0, nextPlannedTotal - totalBudget);

  return {
    ok: nextPlannedTotal <= totalBudget,
    monthKey: params.monthKey,
    totalBudget,
    plannedSum,
    nextPlannedTotal,
    remainingForPlans,
    overBy,
  };
}
