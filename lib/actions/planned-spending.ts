"use server";

import { db } from "@/lib/db";
import { PlannedPeriodType } from "@prisma/client";
import type { SpendingPlan, PlanTimeScale, PlanStatus } from "@/types";
import { getISOWeek } from "date-fns";
function mapPeriodTypeToTimeScale(type: PlannedPeriodType): PlanTimeScale {
  switch (type) {
    case "YEARLY":
      return "year";
    case "QUARTERLY":
      return "quarter";
    case "MONTHLY":
      return "month";
    case "WEEKLY":
      return "week";
    default:
      return "custom";
  }
}

function getPeriodInfo(periodType: PlannedPeriodType, periodKey: string) {
  let year = 0;
  let quarter: 1 | 2 | 3 | 4 | undefined;
  let month: number | undefined;
  let weekOfYear: number | undefined;

  let start: Date;
  let end: Date;

  switch (periodType) {
    case "YEARLY": {
      year = parseInt(periodKey, 10);
      start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
      break;
    }

    case "QUARTERLY": {
      const [yStr, qStr] = periodKey.split("-");
      year = parseInt(yStr, 10);
      quarter = parseInt(qStr.replace("Q", ""), 10) as 1 | 2 | 3 | 4;

      const startMonth = (quarter - 1) * 3; // 0, 3, 6, 9
      const endMonth = startMonth + 2;

      start = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(year, endMonth + 1, 0, 23, 59, 59, 999)); // ngày 0 của tháng tiếp theo
      break;
    }

    case "MONTHLY": {
      const [yStr, mStr] = periodKey.split("-");
      year = parseInt(yStr, 10);
      month = parseInt(mStr, 10); // 1–12

      start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      break;
    }

    case "WEEKLY": {
      const [yStr, wStr] = periodKey.split("-");
      year = parseInt(yStr, 10);
      weekOfYear = parseInt(wStr.replace("W", ""), 10);

      // ISO week: Monday
      const jan4 = new Date(Date.UTC(year, 0, 4));
      const dayOfWeek = jan4.getUTCDay() || 7; // 1–7
      const firstWeekMonday = new Date(
        jan4.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000
      );
      const mondayOfWeek = new Date(
        firstWeekMonday.getTime() + (weekOfYear - 1) * 7 * 24 * 60 * 60 * 1000
      );

      start = mondayOfWeek;
      end = new Date(
        mondayOfWeek.getTime() +
          6 * 24 * 60 * 60 * 1000 +
          (24 * 60 * 60 * 1000 - 1)
      );
      break;
    }

    default: {
      const now = new Date();
      year = now.getUTCFullYear();
      month = now.getUTCMonth() + 1;
      start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      break;
    }
  }

  return { start, end, year, quarter, month, weekOfYear };
}

function computeStatus(
  start: Date,
  end: Date,
  progressPercent: number
): PlanStatus {
  const now = new Date();

  if (now < start) return "upcoming";
  if (now > end) {
    if (progressPercent >= 100) return "completed";
    return "expired";
  }
  return "active";
}

export async function getUserSpendingPlans(
  userId: string
): Promise<SpendingPlan[]> {
  const rows = await db.plannedSpending.findMany({
    where: { userId },
    include: {
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const plans: SpendingPlan[] = [];
  const now = new Date();
  const currentYear = now.getUTCFullYear();

  for (const row of rows) {
    const info = getPeriodInfo(row.periodType, row.periodKey);

    let rangeStart = info.start;
    if (row.periodType === "YEARLY" && info.year > currentYear) {
      rangeStart = row.createdAt;
    }
    const txAgg = await db.transaction.aggregate({
      where: {
        userId,
        type: "expense",
        date: {
          gte: rangeStart,
          lte: info.end,
        },
        ...(row.categoryId && { categoryId: row.categoryId }),
      },
      _sum: { amount: true },
    });

    const actualSpending = Number(txAgg._sum.amount || 0);
    const totalBudget = Number(row.targetAmount || 0);
    const progressPercent =
      totalBudget > 0 ? (actualSpending / totalBudget) * 100 : 0;

    const status = computeStatus(rangeStart, info.end, progressPercent);
    const timeScale = mapPeriodTypeToTimeScale(row.periodType);

    const categories: string[] = row.categoryId ? [row.categoryId] : [];

    const plan: SpendingPlan = {
      id: row.id,

      name: row.title,
      description: undefined,

      timeScale,
      startDate: rangeStart.toISOString(),
      endDate: info.end.toISOString(),

      period: {
        year: info.year,
        quarter: info.quarter,
        month: info.month,
        weekOfYear: info.weekOfYear,
      },

      totalBudget,
      actualSpending,
      progressPercent,

      categories,
      tags: [],

      pinned: row.isPinned,
      status,

      dueDate: undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };

    plans.push(plan);
  }

  return plans;
}

export async function togglePlanPinned(
  userId: string,
  planId: string,
  pinned: boolean
) {
  const plan = await db.plannedSpending.findFirst({
    where: { id: planId, userId },
    select: { id: true },
  });

  if (!plan) {
    throw new Error("Kế hoạch không tồn tại hoặc không thuộc về bạn");
  }

  await db.plannedSpending.update({
    where: { id: planId },
    data: { isPinned: pinned },
  });
}

function buildPeriodKey(input: {
  periodType: PlannedPeriodType;
  year: number;
  quarter?: number;
  month?: number;
  weekOfYear?: number;
}): string {
  const { periodType, year, quarter, month, weekOfYear } = input;

  switch (periodType) {
    case "YEARLY":
      return `${year}`;
    case "QUARTERLY":
      if (!quarter) throw new Error("Thiếu quý cho kế hoạch theo quý");
      return `${year}-Q${quarter}`;
    case "MONTHLY":
      if (!month) throw new Error("Thiếu tháng cho kế hoạch theo tháng");
      return `${year}-${String(month).padStart(2, "0")}`;
    case "WEEKLY":
      if (!weekOfYear) throw new Error("Thiếu tuần cho kế hoạch theo tuần");
      return `${year}-W${String(weekOfYear).padStart(2, "0")}`;
    default:
      throw new Error("Loại chu kỳ không hợp lệ");
  }
}

export interface CreatePlannedSpendingInput {
  userId: string;
  title: string;
  periodType: PlannedPeriodType;
  year: number;
  quarter?: number;
  month?: number;
  weekOfYear?: number;
  targetAmount: number;
  categoryId?: string | null;
  isPinned?: boolean;
}

export async function createPlannedSpending(input: CreatePlannedSpendingInput) {
  const periodKey = buildPeriodKey(input);

  const targetAmountDecimal = input.targetAmount;

  const created = await db.plannedSpending.create({
    data: {
      userId: input.userId,
      title: input.title,
      periodType: input.periodType,
      periodKey,
      targetAmount: targetAmountDecimal,
      categoryId: input.categoryId ?? null,
      isPinned: input.isPinned ?? false,
    },
  });

  return created;
}

export async function getPinnedPlansForDashboard(
  userId: string
): Promise<SpendingPlan[]> {
  const plans = await getUserSpendingPlans(userId);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentWeek = getISOWeek(now);

  return plans.filter((plan) => {
    if (!plan.pinned) return false;

    if (plan.timeScale === "month") {
      return (
        plan.period.year === currentYear && plan.period.month === currentMonth
      );
    }

    if (plan.timeScale === "week") {
      return (
        plan.period.year === currentYear &&
        plan.period.weekOfYear === currentWeek
      );
    }
    if (plan.timeScale === "year") {
      return plan.period.year === currentYear;
    }

    if (plan.timeScale === "quarter") {
      const q = Math.floor((currentMonth - 1) / 3) + 1;
      return plan.period.year === currentYear && plan.period.quarter === q;
    }

    return false;
  });
}

export async function deletePlannedSpending(userId: string, planId: string) {
  const plan = await db.plannedSpending.findFirst({
    where: { id: planId, userId },
    select: { id: true },
  });

  if (!plan) {
    throw new Error("Kế hoạch không tồn tại hoặc không thuộc về bạn");
  }

  await db.plannedSpending.delete({
    where: { id: planId },
  });
}