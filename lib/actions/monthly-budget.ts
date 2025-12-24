"use server";

import { prisma } from "@/lib/prisma";
import { getMonthKey, prevMonthKey, monthKeyToRange } from "@/lib/utils";

async function getExpenseSum(userId: string, monthKey: string) {
  const { start, end } = monthKeyToRange(monthKey);

  const agg = await prisma.transaction.aggregate({
    where: {
      userId,
      type: "expense",
      date: { gte: start, lt: end },
    },
    _sum: { amount: true },
  });

  return Number(agg?._sum?.amount ?? 0);
}

export async function ensureMonthlyBudget(userId: string, monthKey?: string) {
  const key = monthKey ?? getMonthKey(new Date());

  const existing = await prisma.monthlyBudget.findUnique({
    where: { userId_month: { userId, month: key } },
  });
  if (existing) return existing;

  const settings = await prisma.userSettings.findUnique({ where: { userId } });
  const baseIncome = Number(settings?.monthlyBudget ?? 0);

  const prevKey = prevMonthKey(key);
  const prevBudget = await prisma.monthlyBudget.findUnique({
    where: { userId_month: { userId, month: prevKey } },
  });

  let carryOver = 0;
  if (prevBudget) {
    const prevSpent = await getExpenseSum(userId, prevKey);
    const remaining = Number(prevBudget.totalBudget) - prevSpent;
    carryOver = Math.max(0, remaining);
  }

  const totalBudget = baseIncome + carryOver;

  return prisma.monthlyBudget.create({
    data: {
      userId,
      month: key,
      baseIncome,
      carryOver,
      totalBudget,
    },
  });
}
