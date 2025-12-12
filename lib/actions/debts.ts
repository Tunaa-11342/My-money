"use server";

import { db } from "@/lib/db";
import type { DebtPlanItem } from "@/types";
import type { DebtCategory } from "@prisma/client";

function toDebt(row: any): DebtPlanItem {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    amount: Number(row.amount),
    notes: row.notes ?? null,
    pinned: row.isPinned,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getUserDebtPlans(userId: string): Promise<DebtPlanItem[]> {
  const rows = await db.debtPlan.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toDebt);
}

export async function createDebtPlan(input: {
  userId: string;
  title: string;
  category: DebtCategory;
  amount: number;
  notes?: string | null;
  isPinned?: boolean;
}) {
  const created = await db.debtPlan.create({
    data: {
      userId: input.userId,
      title: input.title,
      category: input.category,
      amount: input.amount,
      notes: input.notes ?? null,
      isPinned: input.isPinned ?? false,
    },
  });

  return toDebt(created);
}

export async function toggleDebtPlanPinned(userId: string, planId: string, pinned: boolean) {
  const exists = await db.debtPlan.findFirst({
    where: { id: planId, userId },
    select: { id: true },
  });
  if (!exists) throw new Error("Khoản vay/nợ không tồn tại hoặc không thuộc về bạn");

  await db.debtPlan.update({
    where: { id: planId },
    data: { isPinned: pinned },
  });
}

export async function deleteDebtPlan(userId: string, planId: string) {
  const exists = await db.debtPlan.findFirst({
    where: { id: planId, userId },
    select: { id: true },
  });
  if (!exists) throw new Error("Khoản vay/nợ không tồn tại hoặc không thuộc về bạn");

  await db.debtPlan.delete({ where: { id: planId } });
}
