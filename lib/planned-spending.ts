import { addDays, endOfMonth, endOfWeek, endOfYear, startOfMonth, startOfWeek, startOfYear } from "date-fns";
import { PlannedPeriodType } from "@prisma/client";

export function getRangeFromPeriod(periodType: PlannedPeriodType, periodKey: string) {
  if (periodType === "MONTHLY") {
    const [year, month] = periodKey.split("-").map(Number);
    const from = startOfMonth(new Date(year, month - 1, 1));
    const to = addDays(endOfMonth(from), 1); // < to
    return { from, to };
  }

  if (periodType === "WEEKLY") {
    const [year, week] = periodKey.split("-").map(Number);
    const firstDay = new Date(year, 0, 1);
    const from = startOfWeek(new Date(firstDay.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000), {
      weekStartsOn: 1,
    });
    const to = addDays(endOfWeek(from, { weekStartsOn: 1 }), 1);
    return { from, to };
  }

  if (periodType === "YEARLY") {
    const year = Number(periodKey);
    const from = startOfYear(new Date(year, 0, 1));
    const to = addDays(endOfYear(from), 1);
    return { from, to };
  }

  throw new Error("Invalid period");
}
