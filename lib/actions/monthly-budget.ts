"use server";

import { prisma } from "@/lib/prisma";
import { getMonthKey, prevMonthKey, monthKeyToRange } from "@/lib/utils";

function nextMonthKey(monthKey: string) {
  const [yStr, mStr] = monthKey.split("-");
  let y = Number(yStr);
  let m = Number(mStr);
  m += 1;
  if (m === 13) {
    m = 1;
    y += 1;
  }
  const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  return `${y}-${pad2(m)}`;
}

function listMonthKeys(from: string, to: string) {
  const out: string[] = [];
  let cur = from;
  while (cur <= to) {
    out.push(cur);
    cur = nextMonthKey(cur);
    if (out.length > 240) break; 
  }
  return out;
}

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

  return Number(agg._sum.amount ?? 0);
}

export async function ensureMonthlyBudget(userId: string, monthKey?: string) {
  const key = monthKey ?? getMonthKey(new Date());

  const existing = await prisma.monthlyBudget.findUnique({
    where: { userId_month: { userId, month: key } },
  });
  if (existing) return existing;

  const settings = await prisma.userSettings.findUnique({
    where: { userId },
    select: { monthlyBudget: true },
  });
  const baseIncome = Number(settings?.monthlyBudget ?? 0);

  const lastBudget = await prisma.monthlyBudget.findFirst({
    where: { userId, month: { lt: key } },
    orderBy: { month: "desc" },
  });

  if (!lastBudget) {
    return prisma.monthlyBudget.create({
      data: {
        userId,
        month: key,
        baseIncome,
        carryOver: 0,
        totalBudget: baseIncome,
      },
    });
  }

  const lastSpent = await getExpenseSum(userId, lastBudget.month);
  let carry = Number(lastBudget.totalBudget) - lastSpent;

  const startFill = nextMonthKey(lastBudget.month);
  const monthsToFill = listMonthKeys(startFill, key);

  let resultBudget: any = null;

  for (const mk of monthsToFill) {
    const already = await prisma.monthlyBudget.findUnique({
      where: { userId_month: { userId, month: mk } },
    });

    if (already) {
      const spent = await getExpenseSum(userId, mk);
      carry = Number(already.totalBudget) - spent;
      if (mk === key) resultBudget = already;
      continue;
    }

    const totalBudget = baseIncome + carry;

    const created = await prisma.monthlyBudget.create({
      data: {
        userId,
        month: mk,
        baseIncome,
        carryOver: carry,
        totalBudget,
      },
    });

    const spent = await getExpenseSum(userId, mk);
    carry = totalBudget - spent;

    if (mk === key) resultBudget = created;
  }

  if (!resultBudget) {
    resultBudget = await prisma.monthlyBudget.findUnique({
      where: { userId_month: { userId, month: key } },
    });
  }

  return resultBudget!;
}
