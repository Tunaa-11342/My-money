"use server";

import { Prisma } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";

export type BudgetErrorCode =
  | "USER_SETTINGS_NOT_FOUND"
  | "BUDGET_NOT_STRICT"
  | "DATE_BEFORE_BUDGET_START"
  | "OVER_BUDGET"
  | "OVER_PLAN";

export class BudgetError extends Error {
  code: BudgetErrorCode;
  monthKey?: string;
  details?: Record<string, string>;

  constructor(
    code: BudgetErrorCode,
    message: string,
    monthKey?: string,
    details?: Record<string, string>
  ) {
    super(message);
    this.code = code;
    this.monthKey = monthKey;
    this.details = details;
  }
}

// ---------- Month utils ----------
export function getMonthKeyUTC(d: Date): string {
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}

export function monthKeyToRangeUTC(monthKey: string): {
  start: Date;
  end: Date;
} {
  const [yStr, mStr] = monthKey.split("-");
  const y = Number(yStr);
  const m = Number(mStr);
  const start = new Date(Date.UTC(y, m - 1, 1, 0, 0, 0, 0));
  const end = new Date(Date.UTC(y, m, 1, 0, 0, 0, 0));
  return { start, end };
}

function compareMonthKey(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0;
}

export function iterateMonthKeys(startKey: string, endKey: string): string[] {
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

function utcStartOfDay(d: Date): Date {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)
  );
}
function addDaysUTC(d: Date, days: number): Date {
  const x = new Date(d.getTime());
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}
function daysInMonthUTC(y: number, m1to12: number): number {
  return new Date(Date.UTC(y, m1to12, 0)).getUTCDate();
}
function addMonthsClampedUTC(d: Date, months: number): Date {
  const y = d.getUTCFullYear();
  const m = d.getUTCMonth();
  const day = d.getUTCDate();

  const total = m + months;
  const ny = y + Math.floor(total / 12);
  const nm = ((total % 12) + 12) % 12;

  const dim = daysInMonthUTC(ny, nm + 1);
  const clampedDay = Math.min(day, dim);

  return new Date(
    Date.UTC(
      ny,
      nm,
      clampedDay,
      d.getUTCHours(),
      d.getUTCMinutes(),
      d.getUTCSeconds(),
      d.getUTCMilliseconds()
    )
  );
}

function D(v: number | string | Decimal): Decimal {
  if (v instanceof Decimal) return v;
  return new Decimal(v);
}
function decToStr(v: Decimal): string {
  return v.toFixed(2);
}
export type BudgetMonthSnapshot = {
  monthKey: string;
  fixedIncome: Decimal;
  carryIn: Decimal;
  variableIncome: Decimal;
  availableBudget: Decimal;
  spendable: Decimal;
  actualExpense: Decimal;
  remaining: Decimal;
  carryOut: Decimal;
};

type DB = Prisma.TransactionClient | Prisma.DefaultPrismaClient;

export async function getSettingsStrict(db: DB, userId: string) {
  const settings = await db.userSettings.findUnique({ where: { userId } });
  if (!settings)
    throw new BudgetError(
      "USER_SETTINGS_NOT_FOUND",
      "Không tìm thấy UserSettings."
    );
  if (settings.budgetEnforcement !== "STRICT") {
    throw new BudgetError("BUDGET_NOT_STRICT", "Hệ thống không ở STRICT mode.");
  }
  return settings;
}

export function assertDateNotBeforeBudgetStart(
  date: Date,
  budgetStartAt: Date
) {
  if (date.getTime() < budgetStartAt.getTime()) {
    throw new BudgetError(
      "DATE_BEFORE_BUDGET_START",
      `Ngày giao dịch/kế hoạch không được trước ngày bắt đầu ngân sách (${budgetStartAt.toISOString()}).`
    );
  }
}

async function getTransactionBuckets(
  db: DB,
  userId: string,
  start: Date,
  end: Date
) {
  const rows = await db.transaction.findMany({
    where: { userId, date: { gte: start, lt: end } },
    select: { date: true, type: true, amount: true, category: true },
  });

  const incomeByMonth: Record<string, Decimal> = {};
  const expenseByMonth: Record<string, Decimal> = {};

  const expenseByMonthCategory: Record<string, Record<string, Decimal>> = {};

  for (const r of rows) {
    const mk = getMonthKeyUTC(r.date);
    if (r.type === "income") {
      incomeByMonth[mk] = (incomeByMonth[mk] ?? D(0)).add(r.amount);
    } else {
      expenseByMonth[mk] = (expenseByMonth[mk] ?? D(0)).add(r.amount);

      const cat = r.category || "UNCATEGORIZED";
      expenseByMonthCategory[mk] = expenseByMonthCategory[mk] ?? {};
      expenseByMonthCategory[mk][cat] = (
        expenseByMonthCategory[mk][cat] ?? D(0)
      ).add(r.amount);
    }
  }

  return { incomeByMonth, expenseByMonth, expenseByMonthCategory };
}

// ---------- Budget timeline (carryover NET) ----------
export async function buildBudgetTimeline(
  db: DB,
  userId: string,
  endMonthKey: string
): Promise<Record<string, BudgetMonthSnapshot>> {
  const settings = await getSettingsStrict(db, userId);
  const startMonthKey = getMonthKeyUTC(settings.budgetStartAt);
  const keys = iterateMonthKeys(startMonthKey, endMonthKey);
  if (keys.length === 0) return {};

  const rangeStart = monthKeyToRangeUTC(keys[0]).start;
  const rangeEnd = monthKeyToRangeUTC(keys[keys.length - 1]).end;

  const { incomeByMonth, expenseByMonth } = await getTransactionBuckets(
    db,
    userId,
    rangeStart,
    rangeEnd
  );

  const fixedIncome = D(settings.monthlyBudget);
  let carry = D(0);

  const out: Record<string, BudgetMonthSnapshot> = {};

  for (const mk of keys) {
    const variableIncome = incomeByMonth[mk] ?? D(0);
    const actualExpense = expenseByMonth[mk] ?? D(0);
    const availableBudget = fixedIncome.add(carry).add(variableIncome);
    const spendable = availableBudget;

    if (actualExpense.gt(spendable)) {
      const overBy = actualExpense.sub(spendable);
      throw new BudgetError(
        "OVER_BUDGET",
        `Ngân sách tháng ${mk} bị vượt (expense > spendable).`,
        mk,
        {
          spendable: decToStr(spendable),
          actualExpense: decToStr(actualExpense),
          overBy: decToStr(overBy),
        }
      );
    }

    const remaining = spendable.sub(actualExpense);
    const carryOut = remaining;

    out[mk] = {
      monthKey: mk,
      fixedIncome,
      carryIn: carry,
      variableIncome,
      availableBudget,
      spendable,
      actualExpense,
      remaining,
      carryOut,
    };

    carry = carryOut;
  }

  return out;
}

export async function assertBudgetInvariantFrom(
  db: DB,
  userId: string,
  affectedMonthKey: string
) {
  const settings = await getSettingsStrict(db, userId);
  const startMonthKey = getMonthKeyUTC(settings.budgetStartAt);

  const latest = await db.transaction.findFirst({
    where: { userId },
    orderBy: { date: "desc" },
    select: { date: true },
  });

  const endMonthKey = latest ? getMonthKeyUTC(latest.date) : affectedMonthKey;
  const finalEnd =
    compareMonthKey(endMonthKey, affectedMonthKey) < 0
      ? affectedMonthKey
      : endMonthKey;

  const timeline = await buildBudgetTimeline(db, userId, finalEnd);

  if (compareMonthKey(affectedMonthKey, startMonthKey) < 0) {
    throw new BudgetError(
      "DATE_BEFORE_BUDGET_START",
      `Tháng bị ảnh hưởng (${affectedMonthKey}) trước budgetStartAt.`
    );
  }
  return timeline;
}

type PlannedRow = {
  id: string;
  amount: Decimal;
  periodType:
    | "ONE_TIME"
    | "DAILY"
    | "WEEKLY"
    | "MONTHLY"
    | "QUARTERLY"
    | "YEARLY";
  startDate: Date;
  endDate: Date;
  category: { name: string } | null;
};

const MAX_OCCURRENCES = 20000;

function pushAlloc(
  totalByMonth: Record<string, Decimal>,
  byMonthCategory: Record<string, Record<string, Decimal>>,
  occDate: Date,
  amount: Decimal,
  category: string
) {
  const mk = getMonthKeyUTC(occDate);
  totalByMonth[mk] = (totalByMonth[mk] ?? D(0)).add(amount);

  byMonthCategory[mk] = byMonthCategory[mk] ?? {};
  byMonthCategory[mk][category] = (byMonthCategory[mk][category] ?? D(0)).add(
    amount
  );
}

function allocatePlanIntoRange(
  plan: PlannedRow,
  rangeStart: Date,
  rangeEnd: Date,
  totalByMonth: Record<string, Decimal>,
  byMonthCategory: Record<string, Record<string, Decimal>>
) {
  const category = plan.category?.name ?? "UNCATEGORIZED";

  const start = utcStartOfDay(plan.startDate);
  const endInclusive = utcStartOfDay(plan.endDate);

  let count = 0;

  const within = (d: Date) =>
    d.getTime() >= rangeStart.getTime() && d.getTime() < rangeEnd.getTime();

  if (plan.periodType === "ONE_TIME") {
    const occ = start;
    if (within(occ))
      pushAlloc(totalByMonth, byMonthCategory, occ, plan.amount, category);
    return;
  }

  if (plan.periodType === "DAILY") {
    for (
      let occ = start;
      occ.getTime() <= endInclusive.getTime();
      occ = addDaysUTC(occ, 1)
    ) {
      count++;
      if (count > MAX_OCCURRENCES)
        throw new Error("Plan occurrences too large (DAILY).");
      if (within(occ))
        pushAlloc(totalByMonth, byMonthCategory, occ, plan.amount, category);
    }
    return;
  }

  if (plan.periodType === "WEEKLY") {
    for (
      let occ = start;
      occ.getTime() <= endInclusive.getTime();
      occ = addDaysUTC(occ, 7)
    ) {
      count++;
      if (count > MAX_OCCURRENCES)
        throw new Error("Plan occurrences too large (WEEKLY).");
      if (within(occ))
        pushAlloc(totalByMonth, byMonthCategory, occ, plan.amount, category);
    }
    return;
  }

  // MONTHLY
  for (let occ = start; occ.getTime() <= endInclusive.getTime(); ) {
    count++;
    if (count > MAX_OCCURRENCES)
      throw new Error("Plan occurrences too large (MONTHLY).");
    if (within(occ))
      pushAlloc(totalByMonth, byMonthCategory, occ, plan.amount, category);
    occ = addMonthsClampedUTC(occ, 1);
  }
}

export async function computePlannedAllocationsForRange(
  db: DB,
  userId: string,
  startMonthKey: string,
  endMonthKey: string
): Promise<{
  totalByMonth: Record<string, Decimal>;
  byMonthCategory: Record<string, Record<string, Decimal>>;
}> {
  const { start: rangeStart } = monthKeyToRangeUTC(startMonthKey);
  const { end: rangeEnd } = monthKeyToRangeUTC(endMonthKey);

  const plans = await db.plannedSpending.findMany({
    where: {
      userId,
      startDate: { lt: rangeEnd },
      endDate: { gte: rangeStart },
    },
    select: {
      id: true,
      amount: true,
      periodType: true,
      startDate: true,
      endDate: true,
      category: { select: { name: true } },
    },
  });

  const totalByMonth: Record<string, Decimal> = {};
  const byMonthCategory: Record<string, Record<string, Decimal>> = {};

  for (const p of plans) {
    allocatePlanIntoRange(
      p,
      rangeStart,
      rangeEnd,
      totalByMonth,
      byMonthCategory
    );
  }

  return { totalByMonth, byMonthCategory };
}

export async function assertPlansWithinBudget(
  db: DB,
  userId: string,
  startMonthKey: string,
  endMonthKey: string
) {
  const timeline = await buildBudgetTimeline(db, userId, endMonthKey);
  const { totalByMonth } = await computePlannedAllocationsForRange(
    db,
    userId,
    startMonthKey,
    endMonthKey
  );

  const keys = iterateMonthKeys(startMonthKey, endMonthKey);

  for (const mk of keys) {
    const planned = totalByMonth[mk] ?? D(0);
    const spendable = timeline[mk]?.spendable ?? D(0);

    if (planned.gt(spendable)) {
      const overBy = planned.sub(spendable);
      throw new BudgetError(
        "OVER_PLAN",
        `Kế hoạch chi vượt ngân sách tháng ${mk}.`,
        mk,
        {
          planned: decToStr(planned),
          spendable: decToStr(spendable),
          overBy: decToStr(overBy),
        }
      );
    }
  }

  return true;
}

export async function assertExpenseWithinCategoryPlanIfExists(
  db: DB,
  userId: string,
  monthKey: string,
  category: string
) {
  const { start, end } = monthKeyToRangeUTC(monthKey);

  const txs = await db.transaction.findMany({
    where: { userId, type: "expense", category, date: { gte: start, lt: end } },
    select: { amount: true },
  });
  let spent = D(0);
  for (const t of txs) spent = spent.add(t.amount);

  const { byMonthCategory } = await computePlannedAllocationsForRange(
    db,
    userId,
    monthKey,
    monthKey
  );
  const planned = byMonthCategory[monthKey]?.[category] ?? D(0);

  if (planned.gt(D(0)) && spent.gt(planned)) {
    throw new BudgetError(
      "OVER_PLAN",
      `Chi tiêu danh mục "${category}" vượt kế hoạch trong tháng ${monthKey}.`,
      monthKey,
      {
        planned: decToStr(planned),
        spent: decToStr(spent),
        overBy: decToStr(spent.sub(planned)),
      }
    );
  }
}
