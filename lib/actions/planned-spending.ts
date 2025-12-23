"use server";

import { db } from "@/lib/db";
import { PlannedPeriodType, Prisma } from "@prisma/client";
import type { SpendingPlan, PlanTimeScale, PlanStatus } from "@/types";
import { getISOWeek } from "date-fns";
import { Decimal } from "@prisma/client/runtime/library";

/** =========================
 *  Helpers: Decimal safe
 *  ========================= */
function D(v: number | string | Decimal): Decimal {
  if (v instanceof Decimal) return v;
  return new Decimal(v);
}
function decToNumber(v: Decimal | null | undefined): number {
  return Number(v ?? 0);
}

/** =========================
 *  Period mapping (existing)
 *  ========================= */
function mapPeriodTypeToTimeScale(type: PlannedPeriodType): PlanTimeScale {
  switch (type) {
    case "YEARLY":
      return "year";
    case "QUARTERLY":
      return "quarter";
    case "MONTHLY":
      return "month";
    case "WEEKLY":
      return "week";
    default:
      return "custom";
  }
}

/** =========================
 *  PeriodKey -> start/end UTC
 *  (existing, keep)
 *  ========================= */
function getPeriodInfo(periodType: PlannedPeriodType, periodKey: string) {
  let year = 0;
  let quarter: 1 | 2 | 3 | 4 | undefined;
  let month: number | undefined;
  let weekOfYear: number | undefined;

  let start: Date;
  let end: Date;

  switch (periodType) {
    case "YEARLY": {
      year = parseInt(periodKey, 10);
      start = new Date(Date.UTC(year, 0, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(year, 11, 31, 23, 59, 59, 999));
      break;
    }

    case "QUARTERLY": {
      const [yStr, qStr] = periodKey.split("-");
      year = parseInt(yStr, 10);
      quarter = parseInt(qStr.replace("Q", ""), 10) as 1 | 2 | 3 | 4;

      const startMonth = (quarter - 1) * 3; // 0, 3, 6, 9
      const endMonth = startMonth + 2;

      start = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(year, endMonth + 1, 0, 23, 59, 59, 999)); // ngày 0 của tháng tiếp theo
      break;
    }

    case "MONTHLY": {
      const [yStr, mStr] = periodKey.split("-");
      year = parseInt(yStr, 10);
      month = parseInt(mStr, 10); // 1–12

      start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      break;
    }

    case "WEEKLY": {
      const [yStr, wStr] = periodKey.split("-");
      year = parseInt(yStr, 10);
      weekOfYear = parseInt(wStr.replace("W", ""), 10);

      // ISO week: Monday
      const jan4 = new Date(Date.UTC(year, 0, 4));
      const dayOfWeek = jan4.getUTCDay() || 7; // 1–7
      const firstWeekMonday = new Date(
        jan4.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000
      );
      const mondayOfWeek = new Date(
        firstWeekMonday.getTime() + (weekOfYear - 1) * 7 * 24 * 60 * 60 * 1000
      );

      start = mondayOfWeek;
      end = new Date(
        mondayOfWeek.getTime() +
          6 * 24 * 60 * 60 * 1000 +
          (24 * 60 * 60 * 1000 - 1)
      );
      break;
    }

    default: {
      const now = new Date();
      year = now.getUTCFullYear();
      month = now.getUTCMonth() + 1;
      start = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
      end = new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
      break;
    }
  }

  return { start, end, year, quarter, month, weekOfYear };
}

function computeStatus(start: Date, end: Date, progressPercent: number): PlanStatus {
  const now = new Date();

  if (now < start) return "upcoming";
  if (now > end) {
    if (progressPercent >= 100) return "completed";
    return "expired";
  }
  return "active";
}

/** =========================
 *  STRICT BUDGET ENGINE (local)
 *  - Spendable(month) = fixedIncome + carryIn + incomeMonth
 *  - carryOut NET = spendable - expenseMonth
 *  ========================= */

function getMonthKeyUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
function monthKeyToRangeUTC(monthKey: string): { start: Date; end: Date } {
  const [yStr, mStr] = monthKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr); // 1..12
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  return { start, end };
}
function prevMonthKey(monthKey: string): string {
  const [yStr, mStr] = monthKey.split("-");
  let y = Number(yStr);
  let m = Number(mStr);
  m -= 1;
  if (m === 0) {
    m = 12;
    y -= 1;
  }
  return `${y}-${String(m).padStart(2, "0")}`;
}
function compareMonthKey(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}
function iterateMonthKeys(startKey: string, endKey: string): string[] {
  if (compareMonthKey(startKey, endKey) > 0) return [];
  const out: string[] = [];
  let [y, m] = startKey.split("-").map(Number);
  while (true) {
    const mk = `${y}-${String(m).padStart(2, "0")}`;
    out.push(mk);
    if (mk === endKey) break;
    m += 1;
    if (m === 13) {
      m = 1;
      y += 1;
    }
  }
  return out;
}

async function getUserSettingsStrict(tx: Prisma.TransactionClient, userId: string) {
  const settings = await tx.userSettings.findUnique({ where: { userId } });
  if (!settings) throw new Error("Không tìm thấy cấu hình người dùng (UserSettings).");

  // STRICT mode only
  if (settings.budgetEnforcement !== "STRICT") {
    throw new Error("Hệ thống không ở STRICT mode.");
  }
  if (settings.carryPolicy !== "NET") {
    throw new Error("Hệ thống STRICT yêu cầu CarryPolicy = NET.");
  }

  return settings;
}

/**
 * Tính spendable cho 1 tháng, theo NET carry chain từ budgetStartAt
 * Spendable(month) = fixedIncome + carryIn + incomeMonth
 * carryOut(month) = spendable - expenseMonth
 */
async function computeSpendableForMonthStrict(
  tx: Prisma.TransactionClient,
  userId: string,
  monthKey: string
): Promise<Decimal> {
  const settings = await getUserSettingsStrict(tx, userId);

  const startKey = getMonthKeyUTC(settings.budgetStartAt);
  if (compareMonthKey(monthKey, startKey) < 0) {
    throw new Error(`Không thể tính ngân sách cho tháng ${monthKey} trước budgetStartAt.`);
  }

  const keys = iterateMonthKeys(startKey, monthKey);
  const fixedIncome = D(settings.monthlyBudget);

  // Load all tx in range once
  const rangeStart = monthKeyToRangeUTC(keys[0]).start;
  const rangeEnd = monthKeyToRangeUTC(keys[keys.length - 1]).end;

  const rows = await tx.transaction.findMany({
    where: { userId, date: { gte: rangeStart, lt: rangeEnd } },
    select: { date: true, type: true, amount: true },
  });

  const incomeByMonth: Record<string, Decimal> = {};
  const expenseByMonth: Record<string, Decimal> = {};
  for (const r of rows) {
    const mk = getMonthKeyUTC(r.date);
    if (r.type === "income") {
      incomeByMonth[mk] = (incomeByMonth[mk] ?? D(0)).add(r.amount);
    } else {
      expenseByMonth[mk] = (expenseByMonth[mk] ?? D(0)).add(r.amount);
    }
  }

  let carry = D(0);
  let spendableTarget = D(0);

  for (const mk of keys) {
    const income = incomeByMonth[mk] ?? D(0);
    const expense = expenseByMonth[mk] ?? D(0);

    const spendable = fixedIncome.add(carry).add(income);

    // nếu legacy data có expense > spendable thì throw để khỏi “lách”
    if (expense.gt(spendable)) {
      throw new Error(
        `Dữ liệu chi tiêu tháng ${mk} đã vượt ngân sách (expense=${expense.toFixed(
          2
        )} > spendable=${spendable.toFixed(2)}).`
      );
    }

    const remaining = spendable.sub(expense);
    const carryOut = remaining; // NET

    if (mk === monthKey) spendableTarget = spendable;
    carry = carryOut;
  }

  return spendableTarget;
}

/** =========================
 *  Planned allocation -> month
 *  (convert plan total into month reserved)
 *  - MONTHLY: reserve full targetAmount in that month
 *  - WEEKLY: reserve full targetAmount in month containing week start (monday)
 *  - QUARTERLY: reserve targetAmount / 3 each month in quarter
 *  - YEARLY: reserve targetAmount / 12 each month in year
 *  ========================= */
function allocatePlanToMonth(row: {
  periodType: PlannedPeriodType;
  periodKey: string;
  targetAmount: Decimal;
}, monthKey: string): Decimal {
  const info = getPeriodInfo(row.periodType, row.periodKey);

  // MonthKey of this plan’s time window start/end
  const startMK = getMonthKeyUTC(info.start);
  const endMK = getMonthKeyUTC(info.end);

  // If monthKey outside plan window => 0
  if (compareMonthKey(monthKey, startMK) < 0 || compareMonthKey(monthKey, endMK) > 0) {
    return D(0);
  }

  const total = D(row.targetAmount);

  switch (row.periodType) {
    case "MONTHLY":
      return total;

    case "WEEKLY": {
      // allocate all into month containing monday start
      const mk = getMonthKeyUTC(info.start);
      return mk === monthKey ? total : D(0);
    }

    case "QUARTERLY":
      return total.div(3);

    case "YEARLY":
      return total.div(12);

    default:
      // DAILY/ONE_TIME/custom not used in this file’s create input
      // fallback: allocate everything to start month to avoid under-enforce
      return startMK === monthKey ? total : D(0);
  }
}

/**
 * STRICT check: plannedTotal(month) <= spendable(month)
 * - include tất cả plan hiện có (trừ excludePlanId nếu update)
 * - cộng allocation của plan mới (newRow)
 */
async function assertPlanWithinBudgetStrict(
  tx: Prisma.TransactionClient,
  userId: string,
  newRow: { periodType: PlannedPeriodType; periodKey: string; targetAmount: Decimal },
  excludePlanId?: string
) {
  const info = getPeriodInfo(newRow.periodType, newRow.periodKey);
  const startMK = getMonthKeyUTC(info.start);
  const endMK = getMonthKeyUTC(info.end);

  const months = iterateMonthKeys(startMK, endMK);

  // lấy toàn bộ plan có thể ảnh hưởng trong window (cùng user)
  const plans = await tx.plannedSpending.findMany({
    where: {
      userId,
      ...(excludePlanId ? { id: { not: excludePlanId } } : {}),
      // lọc rộng: cùng khoảng thời gian dựa theo start/end đã lưu
      startDate: { lte: info.end },
      endDate: { gte: info.start },
    },
    select: { id: true, periodType: true, periodKey: true, targetAmount: true, startDate: true, endDate: true },
  });

  for (const mk of months) {
    // planned sum from existing plans
    let planned = D(0);
    for (const p of plans) {
      planned = planned.add(allocatePlanToMonth(
        { periodType: p.periodType, periodKey: p.periodKey, targetAmount: p.targetAmount },
        mk
      ));
    }

    // add new plan allocation
    planned = planned.add(allocatePlanToMonth(newRow, mk));

    const spendable = await computeSpendableForMonthStrict(tx, userId, mk);

    if (planned.gt(spendable)) {
      const overBy = planned.sub(spendable);
      throw new Error(
        `Kế hoạch vượt ngân sách tháng ${mk}. Planned=${planned.toFixed(2)} > Spendable=${spendable.toFixed(
          2
        )}. Vượt=${overBy.toFixed(2)}`
      );
    }
  }
}

/** =========================
 *  Public APIs (existing + upgraded)
 *  ========================= */
export async function getUserSpendingPlans(userId: string): Promise<SpendingPlan[]> {
  const rows = await db.plannedSpending.findMany({
    where: { userId },
    include: { category: true },
    orderBy: { createdAt: "desc" },
  });

  const plans: SpendingPlan[] = [];

  for (const row of rows) {
    const info = getPeriodInfo(row.periodType, row.periodKey);

    const rangeStart = info.start;

    const categoryName = row.category?.name;

    const txAgg = await db.transaction.aggregate({
      where: {
        userId,
        type: "expense",
        date: { gte: rangeStart, lte: info.end },
        ...(categoryName ? { category: categoryName } : {}),
      },
      _sum: { amount: true },
    });

    const actualSpending = Number(txAgg._sum.amount || 0);
    const totalBudget = Number(row.targetAmount || 0);
    const progressPercent = totalBudget > 0 ? (actualSpending / totalBudget) * 100 : 0;

    const status = computeStatus(rangeStart, info.end, progressPercent);
    const timeScale = mapPeriodTypeToTimeScale(row.periodType);

    const categories: string[] = row.categoryId ? [row.categoryId] : [];

    const plan: SpendingPlan = {
      id: row.id,
      name: row.title,
      description: undefined,

      timeScale,
      startDate: rangeStart.toISOString(),
      endDate: info.end.toISOString(),

      period: {
        year: info.year,
        quarter: info.quarter,
        month: info.month,
        weekOfYear: info.weekOfYear,
      },

      totalBudget,
      actualSpending,
      progressPercent,

      categories,
      tags: [],

      pinned: row.isPinned,
      status,

      dueDate: undefined,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };

    plans.push(plan);
  }

  return plans;
}

export async function togglePlanPinned(userId: string, planId: string, pinned: boolean) {
  const plan = await db.plannedSpending.findFirst({
    where: { id: planId, userId },
    select: { id: true },
  });

  if (!plan) throw new Error("Kế hoạch không tồn tại hoặc không thuộc về bạn");

  await db.plannedSpending.update({
    where: { id: planId },
    data: { isPinned: pinned },
  });
}

function buildPeriodKey(input: {
  periodType: PlannedPeriodType;
  year: number;
  quarter?: number;
  month?: number;
  weekOfYear?: number;
}): string {
  const { periodType, year, quarter, month, weekOfYear } = input;

  switch (periodType) {
    case "YEARLY":
      return `${year}`;
    case "QUARTERLY":
      if (!quarter) throw new Error("Thiếu quý cho kế hoạch theo quý");
      return `${year}-Q${quarter}`;
    case "MONTHLY":
      if (!month) throw new Error("Thiếu tháng cho kế hoạch theo tháng");
      return `${year}-${String(month).padStart(2, "0")}`;
    case "WEEKLY":
      if (!weekOfYear) throw new Error("Thiếu tuần cho kế hoạch theo tuần");
      return `${year}-W${String(weekOfYear).padStart(2, "0")}`;
    default:
      throw new Error("Loại chu kỳ không hợp lệ");
  }
}

export interface CreatePlannedSpendingInput {
  userId: string;
  title: string;
  periodType: PlannedPeriodType;
  year: number;
  quarter?: number;
  month?: number;
  weekOfYear?: number;
  targetAmount: number;
  categoryId?: string | null;
  isPinned?: boolean;
}

/**
 * STRICT create:
 * - build periodKey
 * - compute startDate/endDate from period
 * - check plannedTotal(month) <= spendable(month) across affected months
 * - create inside transaction
 */
export async function createPlannedSpending(input: CreatePlannedSpendingInput) {
  const periodKey = buildPeriodKey(input);
  const info = getPeriodInfo(input.periodType, periodKey);

  const targetAmountDecimal = D(input.targetAmount);

  return await db.$transaction(async (tx) => {
    // STRICT budget enforce BEFORE write (but still inside tx)
    await assertPlanWithinBudgetStrict(
      tx,
      input.userId,
      { periodType: input.periodType, periodKey, targetAmount: targetAmountDecimal }
    );

    const created = await tx.plannedSpending.create({
      data: {
        userId: input.userId,

        // schema của m có cả name + title => set đồng bộ
        name: input.title,
        title: input.title,

        periodType: input.periodType,
        periodKey,

        // schema có amount + targetAmount => set amount = targetAmount để hợp lý
        amount: targetAmountDecimal,
        targetAmount: targetAmountDecimal,

        categoryId: input.categoryId ?? null,
        isPinned: input.isPinned ?? false,

        // required fields in schema
        startDate: info.start,
        endDate: info.end,

        // required-but-optional fields: set safe default
        notes: null,
        color: null,
      },
    });

    return created;
  });
}

export async function getPinnedPlansForDashboard(userId: string): Promise<SpendingPlan[]> {
  const plans = await getUserSpendingPlans(userId);

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const currentWeek = getISOWeek(now);

  return plans.filter((plan) => {
    if (!plan.pinned) return false;

    if (plan.timeScale === "month") {
      return plan.period.year === currentYear && plan.period.month === currentMonth;
    }

    if (plan.timeScale === "week") {
      return plan.period.year === currentYear && plan.period.weekOfYear === currentWeek;
    }

    if (plan.timeScale === "year") {
      return plan.period.year === currentYear;
    }

    if (plan.timeScale === "quarter") {
      const q = Math.floor((currentMonth - 1) / 3) + 1;
      return plan.period.year === currentYear && plan.period.quarter === q;
    }

    return false;
  });
}

export async function deletePlannedSpending(userId: string, planId: string) {
  const plan = await db.plannedSpending.findFirst({
    where: { id: planId, userId },
    select: { id: true },
  });

  if (!plan) throw new Error("Kế hoạch không tồn tại hoặc không thuộc về bạn");

  await db.plannedSpending.delete({ where: { id: planId } });
}

/** =========================
 *  (Optional but recommended)
 *  STRICT update function (full)
 *  - if m đang có update elsewhere, đưa vào đây luôn cho kín
 *  ========================= */
export interface UpdatePlannedSpendingInput {
  userId: string;
  planId: string;

  title?: string;
  periodType?: PlannedPeriodType;
  year?: number;
  quarter?: number;
  month?: number;
  weekOfYear?: number;

  targetAmount?: number;
  categoryId?: string | null;
  isPinned?: boolean;
}

export async function updatePlannedSpending(input: UpdatePlannedSpendingInput) {
  return await db.$transaction(async (tx) => {
    const existing = await tx.plannedSpending.findFirst({
      where: { id: input.planId, userId: input.userId },
    });
    if (!existing) throw new Error("Kế hoạch không tồn tại hoặc không thuộc về bạn");

    // determine new periodType & key
    const newPeriodType = input.periodType ?? existing.periodType;

    let newPeriodKey = existing.periodKey;
    if (input.year) {
      // build new key if user provides year/month/week/quarter changes
      newPeriodKey = buildPeriodKey({
        periodType: newPeriodType,
        year: input.year,
        quarter: input.quarter,
        month: input.month,
        weekOfYear: input.weekOfYear,
      });
    }

    const info = getPeriodInfo(newPeriodType, newPeriodKey);

    const newTarget = input.targetAmount !== undefined ? D(input.targetAmount) : existing.targetAmount;

    // STRICT check (exclude existing plan id)
    await assertPlanWithinBudgetStrict(
      tx,
      input.userId,
      { periodType: newPeriodType, periodKey: newPeriodKey, targetAmount: newTarget },
      existing.id
    );

    const updated = await tx.plannedSpending.update({
      where: { id: existing.id },
      data: {
        title: input.title ?? existing.title,
        name: input.title ?? existing.name,

        periodType: newPeriodType,
        periodKey: newPeriodKey,

        targetAmount: newTarget,
        amount: newTarget,

        categoryId: input.categoryId !== undefined ? input.categoryId : existing.categoryId,
        isPinned: input.isPinned !== undefined ? input.isPinned : existing.isPinned,

        startDate: info.start,
        endDate: info.end,
      },
    });

    return updated;
  });
}
