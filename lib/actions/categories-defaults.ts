"use server";

import { db } from "@/lib/db";

const DEFAULT_EXPENSE = [
  { name: "Ăn uống", icon: "🍜" },
  { name: "Di chuyển", icon: "🚌" },
  { name: "Mua sắm", icon: "🛍️" },
];

export async function ensureDefaultExpenseCategories(userId: string) {
  const existing = await db.category.findMany({
    where: { userId, type: "expense" },
    select: { name: true },
  });

  const existingNames = new Set(existing.map((c) => c.name.toLowerCase()));
  const toCreate = DEFAULT_EXPENSE.filter((c) => !existingNames.has(c.name.toLowerCase()));

  if (toCreate.length === 0) return;

  await db.category.createMany({
    data: toCreate.map((c) => ({
      userId,
      type: "expense",
      name: c.name,
      icon: c.icon,
    })),
  });
}
