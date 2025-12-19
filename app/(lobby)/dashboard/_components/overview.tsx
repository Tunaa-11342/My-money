"use client";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { MAX_DATE_RANGE_DAYS } from "@/lib/constants";
import { UserSettings } from "@prisma/client";
import { differenceInDays, startOfMonth } from "date-fns";
import React, { useState } from "react";
import { toast } from "sonner";
// import StatsCards from "./stats-card";
import CategoriesStats from "./categories-stats";
import { PlannedSpendingDashboardWidget } from "./planned-spending-dashboard-widget";
import { CashflowSummaryCards } from "./cashflow-summary-cards";

type OverviewProps = {
  userSettings: UserSettings | null;
};

function Overview({ userSettings }: { userSettings: UserSettings | null }) {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: new Date(),
  });
  if (!userSettings) return null;

  return (
    <>
      {/* HEADER giữ nguyên, full container */}
      <div className="container flex flex-wrap items-end justify-between gap-2 py-6">
        <h2 className="text-3xl font-bold">Tổng quan</h2>
        <div className="flex items-center gap-3">
          <DateRangePicker
            className="text-sm sm:text-base px-2 py-1 sm:px-3 sm:py-2"
            initialDateFrom={dateRange.from}
            initialDateTo={dateRange.to}
            showCompare={false}
            onUpdate={(values) => {
              const { from, to } = values.range;
              if (!from || !to) return;
              if (differenceInDays(to, from) > MAX_DATE_RANGE_DAYS) {
                toast.error(
                  `Vùng chọn quá lớn. Vùng chọn tối đa là ${MAX_DATE_RANGE_DAYS} ngày!`
                );
                return;
              }
              setDateRange({ from, to });
            }}
          />
        </div>
      </div>
      <div className="container flex w-full flex-col gap-4 pb-6">
        <CashflowSummaryCards userSettings={userSettings} />
        <div className="grid gap-4 lg:grid-cols-[2fr,1fr] items-start">
          <CategoriesStats
            userSettings={userSettings}
            from={dateRange.from}
            to={dateRange.to}
          />
          <PlannedSpendingDashboardWidget userSettings={userSettings} />
        </div>
      </div>
    </>
  );
}
export default Overview;
