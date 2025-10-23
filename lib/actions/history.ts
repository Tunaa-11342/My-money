'use server'

import { getDaysInMonth } from 'date-fns'
import { Period, Timeframe } from '@/types'
import { db } from '../db'

export async function getHistoryData(userId: string, timeframe: Timeframe, period: Period) {
  switch (timeframe) {
    case 'year':
      return await getYearHistoryData(userId, period.year)
    case 'month':
      return await getMonthHistoryData(userId, period.year, period.month!)
    case 'week':
      return await getWeekHistoryData(userId, period.year, period.month!, period.week!)
  }
}


export type GetHistoryDataResponseType = Awaited<ReturnType<typeof getHistoryData>>

type HistoryData = {
  expense: number
  income: number
  year: number
  month: number
  day?: number
}

async function getYearHistoryData(userId: string, year: number) {
  const result = await db.yearHistory.groupBy({
    by: ['month'],
    where: {
      userId,
      year,
    },
    _sum: {
      expense: true,
      income: true,
    },
    orderBy: [
      {
        month: 'asc',
      },
    ],
  })

  if (!result || result.length === 0) return []

  const history: HistoryData[] = []

  for (let i = 0; i < 12; i++) {
    let expense = 0
    let income = 0

    const month = result.find((row) => row.month === i)
    if (month) {
      expense = month._sum.expense || 0
      income = month._sum.income || 0
    }

    history.push({
      year,
      month: i,
      expense,
      income,
    })
  }

  return history
}

async function getMonthHistoryData(userId: string, year: number, month: number) {
  const result = await db.monthHistory.groupBy({
    by: ['day'],
    where: {
      userId,
      year,
      month,
    },
    _sum: {
      expense: true,
      income: true,
    },
    orderBy: [
      {
        day: 'asc',
      },
    ],
  })

  if (!result || result.length === 0) return []

  const history: HistoryData[] = []
  const daysInMonth = getDaysInMonth(new Date(year, month))
  for (let i = 1; i <= daysInMonth; i++) {
    let expense = 0
    let income = 0

    const day = result.find((row) => row.day === i)
    if (day) {
      expense = day._sum.expense || 0
      income = day._sum.income || 0
    }

    history.push({
      expense,
      income,
      year,
      month,
      day: i,
    })
  }

  return history
}

export async function getWeekHistoryData(userId: string, year: number, month: number, week: number) {
  const firstDay = new Date(year, month, 1)
  const firstWeekday = firstDay.getDay() || 7

  const startDay = 1 + (week - 1) * 7 - (firstWeekday - 1)
  const startDate = new Date(year, month, Math.max(startDay, 1))
  const endDate = new Date(year, month, Math.min(startDay + 6, new Date(year, month + 1, 0).getDate()))
  endDate.setHours(23, 59, 59, 999)

  const transactions = await db.transaction.findMany({
    where: {
      userId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    select: {
      amount: true,
      type: true,
      date: true,
    },
  })

  const grouped: Record<string, { income: number; expense: number }> = {}
for (const t of transactions) {
  const key = t.date.toISOString().slice(0, 10)
  if (!grouped[key]) grouped[key] = { income: 0, expense: 0 }

  if (t.type.toUpperCase() === 'INCOME') {
    grouped[key].income += t.amount
  } else if (t.type.toUpperCase() === 'EXPENSE') {
    grouped[key].expense += t.amount
  }
}

  const data = []
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().slice(0, 10)
    const val = grouped[key] || { income: 0, expense: 0 }
    data.push({
      day: key,
      label: d.toLocaleDateString('vi-VN', { day: '2-digit', weekday: 'short' }),
      income: val.income,
      expense: val.expense,
    })
  }

  return data
}

export type GetHistoryPeriodsResponseType = Awaited<ReturnType<typeof getHistoryPeriods>>

export async function getHistoryPeriods(userId: string) {
  const result = await db.monthHistory.findMany({
    where: {
      userId,
    },
    select: {
      year: true,
    },
    distinct: ['year'],
    orderBy: [
      {
        year: 'asc',
      },
    ],
  })

  const years = result.map((el) => el.year)
  if (years.length === 0) {
    return [new Date().getFullYear()]
  }

  return years
}
