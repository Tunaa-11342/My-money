'use server'
import { revalidateTag } from 'next/cache'
import { db } from '../db'
import { unstable_cache as cache, unstable_noStore as noStore, revalidatePath } from 'next/cache'
import { prisma } from "@/lib/prisma"

export async function updateFirstLogin(userId: string) {
  await prisma.userSettings.update({
    where: { userId },
    data: { firstLogin: false }
  })
}

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
      userId,
      currency: "VND",
      monthlyBudget: 0,
    },
  });
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
  const updated = await db.userSettings.update({
    where: { userId },
    data: { monthlyBudget },
  })

  revalidateTag('userSettings')
  return updated
}


export async function getCurrentMonthSpending(userId: string) {
  noStore();

  const now = new Date();
  const startOfMonthUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1, 0, 0, 0, 0)
  );
  const startOfNextMonthUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1, 0, 0, 0, 0)
  );

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      type: "expense",
      date: {
        gte: startOfMonthUTC,
        lt: startOfNextMonthUTC,
      },
    },
    select: { amount: true },
  });

  const totalSpending = transactions.reduce((sum, t) => sum + t.amount, 0);

  const settings = await db.userSettings.findUnique({
    where: { userId },
  });

  return {
    currentSpending: totalSpending,
    monthlyBudget: settings?.monthlyBudget ?? 0,
    currency: settings?.currency ?? "VND",
  };
}