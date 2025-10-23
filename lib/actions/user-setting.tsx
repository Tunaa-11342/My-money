'use server'

import { db } from '../db'
import { unstable_cache as cache, unstable_noStore as noStore, revalidatePath } from 'next/cache'

export async function getCacheUserSetting(userId: string) {
  return await cache(
    async () => {
      return db.userSettings.findUnique({
        where: {
          userId: userId,
        },
      })
    },
    ['userSettings'],
    {
      revalidate: 60, 
      tags: ['userSettings'],
    }
  )()
}

export async function getUserSetting(userId: string) {
  return db.userSettings.findUnique({
    where: {
      userId: userId,
    },
  })
}

export async function createUserSetting(userId: string) {
  return db.userSettings.create({
    data: {
      userId: userId,
      currency: 'USD',
      monthlyBudget: 0,
    },
  })
}

export async function getCreateUserSetting(userId: string) {
  const userSetting = await getUserSetting(userId)
  if (!userSetting) {
    return await createUserSetting(userId)
  } else {
    return userSetting
  }
}

export async function updateUserSetting(userId: string, currency: string) {
  return await db.userSettings.update({
    where: {
      userId: userId,
    },
    data: {
      currency,
    },
  })
}

export async function updateUserBudget(userId: string, monthlyBudget: number) {
  return await db.userSettings.update({
    where: {
      userId: userId,
    },
    data: {
      monthlyBudget,
    },
  })
}

export async function getCurrentMonthSpending(userId: string) {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1)

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      type: 'expense', 
      date: {
        gte: startOfMonth,
        lt: endOfMonth,
      },
    },
    select: { amount: true },
  })

  const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0)

  const settings = await db.userSettings.findUnique({
    where: { userId },
  })

  return {
    currentSpending: totalSpending,
    monthlyBudget: settings?.monthlyBudget ?? 0,
    currency: settings?.currency ?? 'VND',
  }
}