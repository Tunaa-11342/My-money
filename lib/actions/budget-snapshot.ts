"use server";

import { prisma } from "@/lib/prisma";

function getMonthRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  return { start, end };
}

function safeNumber(v: any) {
  if (v == null) return 0;
  return typeof v === "number" ? v : Number(v);
}

export type BudgetStatus = "normal" | "warning" | "over";

export type BudgetSnapshot = {
  monthKey: string;


  availableBudget: number;     // Ngân sách khả dụng tháng (thường = income tháng hoặc settings.monthlyBudget)
  allowedToSpend: number;      // Được phép chi (trừ tiết kiệm dự kiến)
  plannedSpending: number;     // Kế hoạch chi (planned-spending)
  spent: number;               // Đã chi (transactions expense)
  remainingOrOver: number;     // Còn lại (dương) / Vượt (âm)

  progress: number;            
  status: BudgetStatus;

  overspendTransactions: Array<{
    id: string;
    date: Date;
    description: string;
    amount: number;
    category: string;
    categoryIcon?: string | null;
  }>;
};

export async function getBudgetSnapshot(userId: string): Promise<BudgetSnapshot> {
  const now = new Date();
  const { start, end } = getMonthRange(now);
  const monthKey = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}`;


  const settings = await prisma.userSettings.findUnique({ where: { userId } });

  const tx = await prisma.transaction.findMany({
    where: { userId, date: { gte: start, lt: end } },
    orderBy: { date: "asc" },
    select: {
      id: true,
      date: true,
      description: true,
      amount: true,
      type: true,
      category: true,
      categoryIcon: true,
    },
  });

  let income = 0;
  let spent = 0;

  const expenseTxAsc = [];
  for (const t of tx) {
    const amt = safeNumber(t.amount);
    if (t.type === "income") income += amt;
    if (t.type === "expense") {
      spent += amt;
      expenseTxAsc.push({ ...t, amount: amt });
    }
  }
  const plans = await prisma.plannedSpending.findMany({
    where: {
      userId,
      periodType: "MONTH",
      periodKey: monthKey,
    },
    select: { targetAmount: true },
  });
  const plannedSpending = plans.reduce((sum, p) => sum + safeNumber(p.targetAmount), 0);
  const savingGoals = await prisma.savingGoal.findMany({
    where: { userId },
    select: { targetAmount: true },
  });
  const plannedSaving = savingGoals.reduce((sum, g) => sum + safeNumber(g.targetAmount), 0);


  const availableBudget = safeNumber(settings?.monthlyBudget) || income;
  const allowedToSpend = Math.max(0, availableBudget - plannedSaving);
  const remainingOrOver = allowedToSpend - spent;

  const progress = allowedToSpend > 0 ? spent / allowedToSpend : spent > 0 ? 1.5 : 0;
  const status: BudgetStatus =
    progress > 1 ? "over" : progress >= 0.8 ? "warning" : "normal";


  const overspendTransactions: BudgetSnapshot["overspendTransactions"] = [];
  if (allowedToSpend > 0) {
    let cumulative = 0;
    for (const t of expenseTxAsc) {
      cumulative += t.amount;
      if (cumulative > allowedToSpend) {
        overspendTransactions.push({
          id: t.id,
          date: t.date,
          description: t.description ?? "",
          amount: t.amount,
          category: t.category,
          categoryIcon: t.categoryIcon ?? null,
        });
      }
    }
  }

  return {
    monthKey,
    availableBudget,
    allowedToSpend,
    plannedSpending,
    spent,
    remainingOrOver,
    progress,
    status,
    overspendTransactions,
  };
}
