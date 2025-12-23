"use server";

import { db } from "../db";
import {
  CreateTransactionSchema,
  CreateTransactionSchemaType,
} from "../schemas/transactions";
import { GetFormatterForCurrency } from "../utils";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Ép Decimal | number | string -> number an toàn để dùng cho formatter + Float increment/decrement
function toNumberAmount(v: unknown): number {
  // Prisma Decimal có .toNumber()
  if (v && typeof v === "object" && "toNumber" in v && typeof (v as any).toNumber === "function") {
    return (v as any).toNumber();
  }
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export async function createTransaction(userId: string, form: CreateTransactionSchemaType) {
  const parsedBody = CreateTransactionSchema.safeParse(form);
  if (!parsedBody.success) {
    throw new Error(parsedBody.error.message);
  }

  const { amount, categoryId, date, description, type } = parsedBody.data;

  // amount từ form thường là number (Zod), nhưng cứ ép 1 lần cho chắc khi update Float
  const amountNum = toNumberAmount(amount);

  const categoryRow = await db.category.findUnique({
    where: { id: categoryId },
  });

  if (!categoryRow) {
    throw new Error("Danh mục không tồn tại");
  }

  await db.$transaction([
    db.transaction.create({
      data: {
        userId,
        amount, // nếu Transaction.amount là Decimal thì Prisma vẫn nhận number ok
        date,
        description: description || "",
        type,
        category: categoryRow.name,
        categoryIcon: categoryRow.icon,
      },
    }),

    db.monthHistory.upsert({
      where: {
        day_month_year_userId: {
          userId,
          day: date.getUTCDate(),
          month: date.getUTCMonth(),
          year: date.getUTCFullYear(),
        },
      },
      create: {
        userId,
        day: date.getUTCDate(),
        month: date.getUTCMonth(),
        year: date.getUTCFullYear(),
        expense: type === "expense" ? amountNum : 0,
        income: type === "income" ? amountNum : 0,
      },
      update: {
        expense: { increment: type === "expense" ? amountNum : 0 },
        income: { increment: type === "income" ? amountNum : 0 },
      },
    }),

    db.yearHistory.upsert({
      where: {
        month_year_userId: {
          userId,
          month: date.getUTCMonth(),
          year: date.getUTCFullYear(),
        },
      },
      create: {
        userId,
        month: date.getUTCMonth(),
        year: date.getUTCFullYear(),
        expense: type === "expense" ? amountNum : 0,
        income: type === "income" ? amountNum : 0,
      },
      update: {
        expense: { increment: type === "expense" ? amountNum : 0 },
        income: { increment: type === "income" ? amountNum : 0 },
      },
    }),
  ]);
}

export async function getBalanceStats(userId: string, from: Date, to: Date) {
  const totals = await db.transaction.groupBy({
    by: ["type"],
    where: { userId, date: { gte: from, lte: to } },
    _sum: { amount: true },
  });

  const expenseRaw = totals.find((t) => t.type === "expense")?._sum.amount ?? 0;
  const incomeRaw = totals.find((t) => t.type === "income")?._sum.amount ?? 0;

  return {
    expense: toNumberAmount(expenseRaw),
    income: toNumberAmount(incomeRaw),
  };
}

export type GetTransactionHistoryResponseType = Awaited<
  ReturnType<typeof getTransactionsHistory>
>;

export async function getTransactionsHistory(from: Date, to: Date) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  let userSettings = await db.userSettings.findUnique({
    where: { userId: user.id },
  });

  if (!userSettings) {
    userSettings = await db.userSettings.create({
      data: {
        userId: user.id,
        currency: "VND",
      },
    });

    const defaultCategories = [
      { name: "Ăn uống", type: "expense", icon: "🍚" },
      { name: "Tiền điện", type: "expense", icon: "💡" },
      { name: "Tiền nước", type: "expense", icon: "🚿" },
      { name: "Dầu gội", type: "expense", icon: "🧴" },
      { name: "Tiền lương", type: "income", icon: "💵" },
      { name: "Tiền thưởng", type: "income", icon: "🎁" },
    ];

    await db.category.createMany({
      data: defaultCategories.map((c) => ({ ...c, userId: user.id })),
    });
  }

  const formatter = GetFormatterForCurrency(userSettings.currency);

  const transactions = await db.transaction.findMany({
    where: {
      userId: userSettings.userId,
      date: { gte: from, lte: to },
    },
    orderBy: { date: "desc" },
  });

  return transactions.map((transaction) => ({
    ...transaction,
    formattedAmount: formatter.format(toNumberAmount(transaction.amount)),
  }));
}

export async function DeleteTransaction(id: string) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const transaction = await db.transaction.findUnique({
    where: { userId: user.id, id },
  });
  if (!transaction) throw new Error("bad request");

  const amt = toNumberAmount(transaction.amount);

  await db.$transaction([
    db.transaction.delete({
      where: { id, userId: user.id },
    }),

    db.monthHistory.update({
      where: {
        day_month_year_userId: {
          userId: user.id,
          day: transaction.date.getUTCDate(),
          month: transaction.date.getUTCMonth(),
          year: transaction.date.getUTCFullYear(),
        },
      },
      data: {
        ...(transaction.type === "expense" && {
          expense: { decrement: amt },
        }),
        ...(transaction.type === "income" && {
          income: { decrement: amt },
        }),
      },
    }),

    db.yearHistory.update({
      where: {
        month_year_userId: {
          userId: user.id,
          month: transaction.date.getUTCMonth(),
          year: transaction.date.getUTCFullYear(),
        },
      },
      data: {
        ...(transaction.type === "expense" && {
          expense: { decrement: amt },
        }),
        ...(transaction.type === "income" && {
          income: { decrement: amt },
        }),
      },
    }),
  ]);
}
