"use server";

import { prisma } from "@/lib/prisma";
import { monthKeyToRange, getMonthKey } from "@/lib/utils";
import { getMonthlyPlannedLimit } from "@/lib/actions/planned-sum";

export async function validateExpenseAgainstMonthlyPlan(params: {
  userId: string;
  amount: number;
  date: Date;
}) {
  const monthKey = getMonthKey(params.date);
  const plannedLimit = await getMonthlyPlannedLimit(params.userId, monthKey);
  

  const { start, end } = monthKeyToRange(monthKey);

  const agg = await prisma.transaction.aggregate({
    where: {
      userId: params.userId,
      type: "expense",
      date: { gte: start, lt: end },
    },
    _sum: { amount: true },
  });

  const spent = Number(agg?._sum?.amount ?? 0);
  const nextSpent = spent + Number(params.amount ?? 0);
  const limit = plannedLimit;

  const overBy = Math.max(0, nextSpent - limit);

  return {
    ok: limit > 0 && nextSpent <= limit,
    monthKey,
    limit,         
    plannedLimit, 
    spent,
    nextSpent,
    remaining: limit - spent,
    overBy,
    reason: limit <= 0 ? "NO_PLAN" : overBy > 0 ? "OVER_PLAN" : "OK",
  };
}
