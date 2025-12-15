"use server";

import { db } from "@/lib/db";
import type { PlannedPeriodType } from "@prisma/client";

export type CashflowForecastRow = {
  monthKey: string; // YYYY-MM
  income: number; // monthlyBudget (fixed income)
  plannedSpending: number; // planned spending allocated into this month
  goalSaving: number; // recommended saving for pinned saving goals
  net: number; // income - plannedSpending - goalSaving
};

export type CashflowSummary = {
  currency: string;
  fixedIncome: number;

  currentMonthKey: string;
  currentMonthActualExpense: number;
  currentMonthPlannedSpending: number;
  currentMonthGoalSaving: number;

  forecastMonths: number;
  forecast: CashflowForecastRow[];

  warnings: {
    negativeMonths: string[]; // monthKey where net < 0
  };
};

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toMonthKeyUTC(d: Date) {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth() + 1;
  return `${y}-${pad2(m)}`;
}

function startOfMonthUTC(year: number, monthIndex0: number) {
  return new Date(Date.UTC(year, monthIndex0, 1, 0, 0, 0, 0));
}

function addMonthsUTC(d: Date, months: number) {
  const y = d.getUTCFullYear();
  const m0 = d.getUTCMonth();
  return startOfMonthUTC(y, m0 + months);
}

function addDaysUTC(d: Date, days: number) {
  return new Date(d.getTime() + days * 86400000);
}

/**
 * ISO week (Monday as first day).
 * Accepts:
 * - "YYYY-W02"
 * - "YYYY-02" (fallback if user stored week without W)
 */
function getIsoWeekStartUTC(year: number, week: number) {
  const jan4 = new Date(Date.UTC(year, 0, 4, 0, 0, 0, 0));
  const dayOfWeek = jan4.getUTCDay() || 7; // 1..7, Monday..Sunday
  const firstWeekMonday = new Date(jan4.getTime() - (dayOfWeek - 1) * 86400000);
  return addDaysUTC(firstWeekMonday, (week - 1) * 7);
}

function parsePlannedPeriodRangeUTC(periodType: PlannedPeriodType, periodKey: string) {
  // returns [start, end) in UTC
  switch (periodType) {
    case "YEARLY": {
      const year = parseInt(periodKey, 10);
      const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
      return { start, end };
    }

    case "QUARTERLY": {
      const [yStr, qStr] = periodKey.split("-");
      const year = parseInt(yStr, 10);
      const quarter = parseInt(qStr.replace("Q", ""), 10); // 1..4
      const startMonth = (quarter - 1) * 3; // 0,3,6,9
      const start = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, startMonth + 3, 1, 0, 0, 0, 0));
      return { start, end };
    }

    case "MONTHLY": {
      const [yStr, mStr] = periodKey.split("-");
      const year = parseInt(yStr, 10);
      const month = parseInt(mStr, 10); // 1..12
      const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      return { start, end };
    }

    case "WEEKLY": {
      const [yStr, wRaw] = periodKey.split("-");
      const year = Number(yStr);
      const week = Number(String(wRaw).replace("W", "")); // supports W02 or 02

      const start = getIsoWeekStartUTC(year, week);
      const end = addDaysUTC(start, 7);
      return { start, end };
    }

    default: {
      // fallback: treat as current month
      const now = new Date();
      const start = startOfMonthUTC(now.getUTCFullYear(), now.getUTCMonth());
      const end = addMonthsUTC(start, 1);
      return { start, end };
    }
  }
}

function overlapMs(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  const start = Math.max(aStart.getTime(), bStart.getTime());
  const end = Math.min(aEnd.getTime(), bEnd.getTime());
  return Math.max(0, end - start);
}

/**
 * Allocate an amount across months proportionally by overlapped milliseconds.
 * This makes WEEKLY crossing month boundary still correct.
 */
function allocateAmountToMonthsUTC(start: Date, end: Date, amount: number) {
  const totalMs = Math.max(1, end.getTime() - start.getTime());
  const map: Record<string, number> = {};

  // iterate month by month
  let cursor = startOfMonthUTC(start.getUTCFullYear(), start.getUTCMonth());
  const endMonthStart = startOfMonthUTC(end.getUTCFullYear(), end.getUTCMonth());

  // include last month if end spills into it
  while (cursor.getTime() <= endMonthStart.getTime()) {
    const next = addMonthsUTC(cursor, 1);
    const key = toMonthKeyUTC(cursor);
    const ms = overlapMs(start, end, cursor, next);
    if (ms > 0) {
      map[key] = (map[key] || 0) + (amount * ms) / totalMs;
    }
    cursor = next;
  }

  return map;
}

function monthsDiffInclusiveUTC(fromMonthStart: Date, toMonthStart: Date) {
  const y1 = fromMonthStart.getUTCFullYear();
  const m1 = fromMonthStart.getUTCMonth(); // 0..11
  const y2 = toMonthStart.getUTCFullYear();
  const m2 = toMonthStart.getUTCMonth();
  const diff = (y2 - y1) * 12 + (m2 - m1);
  return diff + 1; // inclusive
}

export async function getCashflowSummary(userId: string, monthsAhead = 6): Promise<CashflowSummary> {
  const settings = await db.userSettings.findUnique({
    where: { userId },
    select: { currency: true, monthlyBudget: true },
  });

  const currency = settings?.currency ?? "VND";
  const fixedIncome = Number(settings?.monthlyBudget ?? 0);

  const now = new Date();
  const thisMonthStart = startOfMonthUTC(now.getUTCFullYear(), now.getUTCMonth());
  const nextMonthStart = addMonthsUTC(thisMonthStart, 1);
  const currentMonthKey = toMonthKeyUTC(thisMonthStart);

  // Actual expense in current month
  const expenseAgg = await db.transaction.aggregate({
    where: {
      userId,
      type: "expense",
      date: {
        gte: thisMonthStart,
        lt: nextMonthStart,
      },
    },
    _sum: { amount: true },
  });
  const currentMonthActualExpense = Number(expenseAgg._sum.amount ?? 0);

  // Planned spending: fetch all then allocate into months (small per user, OK)
  const plannedRows = await db.plannedSpending.findMany({
    where: { userId },
    select: {
      periodType: true,
      periodKey: true,
      targetAmount: true,
    },
  });

  const plannedByMonth: Record<string, number> = {};
  for (const row of plannedRows) {
    const amt = Number(row.targetAmount ?? 0);
    if (!amt) continue;

    const { start, end } = parsePlannedPeriodRangeUTC(row.periodType, row.periodKey);
    const allocated = allocateAmountToMonthsUTC(start, end, amt);
    for (const [mk, v] of Object.entries(allocated)) {
      plannedByMonth[mk] = (plannedByMonth[mk] || 0) + v;
    }
  }

  // Saving goals (pinned): convert into recommended monthly saving until targetDate
  const goals = await db.savingGoal.findMany({
    where: { userId, isPinned: true },
    select: {
      title: true,
      targetAmount: true,
      currentAmount: true,
      targetDate: true,
    },
  });

  const goalSavingByMonth: Record<string, number> = {};
  for (const g of goals) {
    if (!g.targetDate) continue;

    const target = new Date(g.targetDate);
    // ignore goals already due in the past
    if (target.getTime() < thisMonthStart.getTime()) continue;

    const remaining = Math.max(0, Number(g.targetAmount ?? 0) - Number(g.currentAmount ?? 0));
    if (remaining <= 0) continue;

    const targetMonthStart = startOfMonthUTC(target.getUTCFullYear(), target.getUTCMonth());
    const monthsLeft = monthsDiffInclusiveUTC(thisMonthStart, targetMonthStart);
    const perMonth = remaining / Math.max(1, monthsLeft);

    // apply perMonth from this month up to target month inclusive
    for (let i = 0; i < monthsLeft; i++) {
      const mStart = addMonthsUTC(thisMonthStart, i);
      const mk = toMonthKeyUTC(mStart);
      goalSavingByMonth[mk] = (goalSavingByMonth[mk] || 0) + perMonth;
    }
  }

  // Build forecast rows
  const forecast: CashflowForecastRow[] = [];
  const negativeMonths: string[] = [];

  for (let i = 0; i < monthsAhead; i++) {
    const mStart = addMonthsUTC(thisMonthStart, i);
    const mk = toMonthKeyUTC(mStart);
    const plannedSpending = plannedByMonth[mk] || 0;
    const goalSaving = goalSavingByMonth[mk] || 0;

    const net = fixedIncome - plannedSpending - goalSaving;
    if (net < 0) negativeMonths.push(mk);

    forecast.push({
      monthKey: mk,
      income: fixedIncome,
      plannedSpending,
      goalSaving,
      net,
    });
  }

  const currentMonthPlannedSpending = plannedByMonth[currentMonthKey] || 0;
  const currentMonthGoalSaving = goalSavingByMonth[currentMonthKey] || 0;

  return {
    currency,
    fixedIncome,

    currentMonthKey,
    currentMonthActualExpense,
    currentMonthPlannedSpending,
    currentMonthGoalSaving,

    forecastMonths: monthsAhead,
    forecast,

    warnings: { negativeMonths },
  };
}
