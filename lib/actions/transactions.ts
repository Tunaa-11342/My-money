'use server'

import { db } from '../db'
import { CreateTransactionSchema, CreateTransactionSchemaType } from '../schemas/transactions'
import { GetFormatterForCurrency } from '../utils'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'

export async function createTransaction(userId: string, form: CreateTransactionSchemaType) {
  const parsedBody = CreateTransactionSchema.safeParse(form)
  if (!parsedBody.success) {
    throw new Error(parsedBody.error.message)
  }

  const { amount, category, date, description, type } = parsedBody.data

  const categoryRow = await db.category.findFirst({
    where: { userId, name: category },
  })
  if (!categoryRow) {
    throw new Error('category not found')
  }

  await db.$transaction([
    // Ghi giao dịch mới
    db.transaction.create({
      data: {
        userId,
        amount,
        date,
        description: description || '',
        type,
        category: categoryRow.name,
        categoryIcon: categoryRow.icon,
      },
    }),

    // Cập nhật bảng tháng
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
        expense: type === 'expense' ? amount : 0,
        income: type === 'income' ? amount : 0,
      },
      update: {
        expense: { increment: type === 'expense' ? amount : 0 },
        income: { increment: type === 'income' ? amount : 0 },
      },
    }),

    // Cập nhật bảng năm
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
        expense: type === 'expense' ? amount : 0,
        income: type === 'income' ? amount : 0,
      },
      update: {
        expense: { increment: type === 'expense' ? amount : 0 },
        income: { increment: type === 'income' ? amount : 0 },
      },
    }),
  ])
}

export async function getBalanceStats(userId: string, from: Date, to: Date) {
  const totals = await db.transaction.groupBy({
    by: ['type'],
    where: { userId, date: { gte: from, lte: to } },
    _sum: { amount: true },
  })

  return {
    expense: totals.find((t) => t.type === 'expense')?._sum.amount || 0,
    income: totals.find((t) => t.type === 'income')?._sum.amount || 0,
  }
}

export type GetTransactionHistoryResponseType = Awaited<
  ReturnType<typeof getTransactionsHistory>
>

export async function getTransactionsHistory(from: Date, to: Date) {
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in')
  }

  let userSettings = await db.userSettings.findUnique({
    where: { userId: user.id },
  })

  // Nếu chưa có -> tạo mặc định
  if (!userSettings) {
    userSettings = await db.userSettings.create({
      data: {
        userId: user.id,
        currency: 'VND',
      },
    })

    // Tạo sẵn các danh mục mặc định
    const defaultCategories = [
      { name: 'Ăn uống', type: 'expense', icon: '🍚' },
      { name: 'Tiền điện', type: 'expense', icon: '💡' },
      { name: 'Tiền nước', type: 'expense', icon: '🚿' },
      { name: 'Dầu gội', type: 'expense', icon: '🧴' },
      { name: 'Tiền lương', type: 'income', icon: '💵' },
      { name: 'Tiền thưởng', type: 'income', icon: '🎁' },
    ]

    await db.category.createMany({
      data: defaultCategories.map((c) => ({ ...c, userId: user.id })),
    })
  }

  // Định dạng hiển thị theo tiền tệ người dùng
  const formatter = GetFormatterForCurrency(userSettings.currency)

  const transactions = await db.transaction.findMany({
    where: {
      userId: userSettings.userId,
      date: { gte: from, lte: to },
    },
    orderBy: { date: 'desc' },
  })

  return transactions.map((transaction) => ({
    ...transaction,
    formattedAmount: formatter.format(transaction.amount),
  }))
}

export async function DeleteTransaction(id: string) {
  const user = await currentUser()
  if (!user) {
    redirect('/sign-in')
  }

  const transaction = await db.transaction.findUnique({
    where: { userId: user.id, id },
  })
  if (!transaction) {
    throw new Error('bad request')
  }

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
        ...(transaction.type === 'expense' && {
          expense: { decrement: transaction.amount },
        }),
        ...(transaction.type === 'income' && {
          income: { decrement: transaction.amount },
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
        ...(transaction.type === 'expense' && {
          expense: { decrement: transaction.amount },
        }),
        ...(transaction.type === 'income' && {
          income: { decrement: transaction.amount },
        }),
      },
    }),
  ])
}
