"use server";

import { prisma } from "@/lib/prisma";
import { PlannedPeriodType } from "@prisma/client";

export async function getMonthlyPlannedLimit(userId: string, monthKey: string) {
  const agg = await prisma.plannedSpending.aggregate({
    where: {
      userId,
      periodType: PlannedPeriodType.MONTHLY,
      periodKey: monthKey,
    },
    _sum: { targetAmount: true },
  });

  return Number(agg?._sum?.targetAmount ?? 0);
}
