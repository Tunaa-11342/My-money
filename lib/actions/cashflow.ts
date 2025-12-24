"use server";

import { db } from "@/lib/db";
import type { PlannedPeriodType } from "@prisma/client";
import { ensureMonthlyBudget } from "@/lib/actions/monthly-budget";

export type CashflowForecastRow = {
  monthKey: string;

  fixedIncome: number;
  variableIncome: number;
  income: number;

  plannedSpending: number;
  goalSaving: number;
  net: number;
};

export type CashflowSummary = {
  currency: string;
  fixedIncome: number;
  currentMonthKey: string;
  currentMonthVariableIncome: number;
  currentMonthTotalIncome: number;
  currentMonthActualExpense: number;
  currentMonthPlannedSpending: number;
  currentMonthGoalSaving: number;
  forecastMonths: number;
  forecast: CashflowForecastRow[];
  currentMonthTotalBudget: number;
  currentMonthCarryOver: number;

  warnings: {
    negativeMonths: string[];
  };
};

function pad2(n: number) {
  return n < 10 ? `0${n}` : `${n}`;
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

function getIsoWeekStartUTC(year: number, week: number) {
  const jan4 = new Date(Date.UTC(year, 0, 4, 0, 0, 0, 0));
  const jan4Day = jan4.getUTCDay() || 7; // 1..7
  const mondayWeek1 = addDaysUTC(jan4, -(jan4Day - 1));
  return addDaysUTC(mondayWeek1, (week - 1) * 7);
}

function parsePlannedPeriodRangeUTC(
  periodType: PlannedPeriodType,
  periodKey: string
) {
  switch (periodType) {
    case "WEEKLY": {
      const [yStr, wStrRaw] = periodKey.split("-");
      const year = parseInt(yStr, 10);
      const week = parseInt((wStrRaw ?? "").replace("W", ""), 10);
      const start = getIsoWeekStartUTC(year, week);
      const end = addDaysUTC(start, 7);
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

    case "YEARLY": {
      const year = parseInt(periodKey, 10);
      const start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0, 0));
      return { start, end };
    }

    case "QUARTERLY": {
      const [yStr, qStr] = periodKey.split("-");
      const year = parseInt(yStr, 10);
      const quarter = parseInt(qStr.replace("Q", ""), 10);
      const startMonth = (quarter - 1) * 3;
      const start = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, startMonth + 3, 1, 0, 0, 0, 0));
      return { start, end };
    }

    default: {
      const [yStr, mStr] = periodKey.split("-");
      const year = parseInt(yStr, 10);
      const month = parseInt(mStr, 10) || 1;
      const start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      const end = new Date(Date.UTC(year, month, 1, 0, 0, 0, 0));
      return { start, end };
    }
  }
}

function allocateAmountToMonthsUTC(start: Date, end: Date, amount: number) {
  const totalDays = Math.max(
    1,
    Math.round((end.getTime() - start.getTime()) / 86400000)
  );
  const out: Record<string, number> = {};

  let cur = start;
  while (cur < end) {
    const mk = toMonthKeyUTC(cur);

    const monthStart = startOfMonthUTC(cur.getUTCFullYear(), cur.getUTCMonth());
    const nextMonth = addMonthsUTC(monthStart, 1);

    const segStart = cur;
    const segEnd = nextMonth < end ? nextMonth : end;

    const segDays = Math.max(
      0,
      Math.round((segEnd.getTime() - segStart.getTime()) / 86400000)
    );
    if (segDays > 0) {
      out[mk] = (out[mk] || 0) + (amount * segDays) / totalDays;
    }

    cur = segEnd;
  }

  return out;
}

export async function getCashflowSummary(
  userId: string,
  monthsAhead = 6
): Promise<CashflowSummary> {
  const settings = await db.userSettings.findUnique({
    where: { userId },
    select: { currency: true, monthlyBudget: true },
  });

  const currency = settings?.currency ?? "VND";
  const fixedIncome = Number(settings?.monthlyBudget ?? 0);

  const now = new Date();
  const thisMonthStart = startOfMonthUTC(
    now.getUTCFullYear(),
    now.getUTCMonth()
  );
  const nextMonthStart = addMonthsUTC(thisMonthStart, 1);
  const currentMonthKey = toMonthKeyUTC(thisMonthStart);
  const mb = await ensureMonthlyBudget(userId, currentMonthKey);

  const currentMonthTotalBudget = Number(mb.totalBudget ?? 0);
  const currentMonthCarryOver = Number(mb.carryOver ?? 0);

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

  const forecastEnd = addMonthsUTC(thisMonthStart, Math.max(1, monthsAhead));

  const incomeTxs = await db.transaction.findMany({
    where: {
      userId,
      type: "income",
      date: {
        gte: thisMonthStart,
        lt: forecastEnd,
      },
    },
    select: { amount: true, date: true },
  });

  const variableIncomeByMonth: Record<string, number> = {};
  for (const t of incomeTxs) {
    const mk = toMonthKeyUTC(t.date);
    variableIncomeByMonth[mk] =
      (variableIncomeByMonth[mk] || 0) + Number(t.amount ?? 0);
  }

  const currentMonthVariableIncome =
    variableIncomeByMonth[currentMonthKey] || 0;
  const currentMonthTotalIncome = fixedIncome + currentMonthVariableIncome;

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

    const { start, end } = parsePlannedPeriodRangeUTC(
      row.periodType,
      row.periodKey
    );
    const allocated = allocateAmountToMonthsUTC(start, end, amt);
    for (const [mk, v] of Object.entries(allocated)) {
      plannedByMonth[mk] = (plannedByMonth[mk] || 0) + v;
    }
  }

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
    const target = Number(g.targetAmount ?? 0);
    const current = Number(g.currentAmount ?? 0);
    const remaining = Math.max(0, target - current);
    if (remaining <= 0) continue;

    const td = g.targetDate ? new Date(g.targetDate) : null;
    if (!td) continue;

    const start = thisMonthStart;
    const end = startOfMonthUTC(td.getUTCFullYear(), td.getUTCMonth() + 1);

    if (end <= start) continue;

    const allocated = allocateAmountToMonthsUTC(start, end, remaining);
    for (const [mk, v] of Object.entries(allocated)) {
      goalSavingByMonth[mk] = (goalSavingByMonth[mk] || 0) + v;
    }
  }

  const forecast: CashflowForecastRow[] = [];
  const negativeMonths: string[] = [];

  for (let i = 0; i < monthsAhead; i++) {
    const mStart = addMonthsUTC(thisMonthStart, i);
    const mk = toMonthKeyUTC(mStart);
    const plannedSpending = plannedByMonth[mk] || 0;
    const goalSaving = goalSavingByMonth[mk] || 0;

    const variableIncome = variableIncomeByMonth[mk] || 0;
    const income = fixedIncome + variableIncome;

    const net = income - plannedSpending - goalSaving;
    if (net < 0) negativeMonths.push(mk);

    forecast.push({
      monthKey: mk,
      fixedIncome,
      variableIncome,
      income,
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
    currentMonthVariableIncome,
    currentMonthTotalIncome,
    currentMonthCarryOver,
    currentMonthActualExpense,
    currentMonthPlannedSpending,
    currentMonthGoalSaving,
    currentMonthTotalBudget,
    forecastMonths: monthsAhead,
    forecast,

    warnings: { negativeMonths },
  };
}
