"use server";

import { db } from "@/lib/db";
import type { SavingGoalPlan } from "@/types";

function toGoal(row: any): SavingGoalPlan {
  return {
    id: row.id,
    title: row.title,
    targetAmount: Number(row.targetAmount),
    currentAmount: Number(row.currentAmount),
    startDate: row.startDate.toISOString(),
    targetDate: row.targetDate ? row.targetDate.toISOString() : null,
    pinned: row.isPinned,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function getUserSavingGoals(userId: string): Promise<SavingGoalPlan[]> {
  const rows = await db.savingGoal.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(toGoal);
}

export async function createSavingGoal(input: {
  userId: string;
  title: string;
  targetAmount: number;
  currentAmount?: number;
  targetDate?: Date | null;
  isPinned?: boolean;
}) {
  const created = await db.savingGoal.create({
    data: {
      userId: input.userId,
      title: input.title,
      targetAmount: input.targetAmount,
      currentAmount: input.currentAmount ?? 0,
      targetDate: input.targetDate ?? null,
      isPinned: input.isPinned ?? false,
    },
  });

  return toGoal(created);
}

export async function toggleSavingGoalPinned(userId: string, goalId: string, pinned: boolean) {
  const exists = await db.savingGoal.findFirst({
    where: { id: goalId, userId },
    select: { id: true },
  });
  if (!exists) throw new Error("Mục tiêu không tồn tại hoặc không thuộc về bạn");

  await db.savingGoal.update({
    where: { id: goalId },
    data: { isPinned: pinned },
  });
}

export async function deleteSavingGoal(userId: string, goalId: string) {
  const exists = await db.savingGoal.findFirst({
    where: { id: goalId, userId },
    select: { id: true },
  });
  if (!exists) throw new Error("Mục tiêu không tồn tại hoặc không thuộc về bạn");

  await db.savingGoal.delete({ where: { id: goalId } });
}
