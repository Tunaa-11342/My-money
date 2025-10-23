"use client";

import SkeletonWrapper from "@/components/skeletons/wrapper-skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GetHistoryPeriodsResponseType,
  getHistoryPeriods,
} from "@/lib/actions/history";
import { Period, Timeframe } from "@/types";
import { useQuery } from "@tanstack/react-query";
import React from "react";
import { CalendarDays, BarChart3, LineChart, Clock } from "lucide-react";

interface Props {
  period: Period;
  setPeriod: (period: Period) => void;
  timeframe: Timeframe;
  setTimeframe: (timeframe: Timeframe) => void;
  userId: string;
}

function HistoryPeriodSelector({
  period,
  setPeriod,
  timeframe,
  setTimeframe,
  userId,
}: Props) {
  const historyPeriods = useQuery<GetHistoryPeriodsResponseType>({
    queryKey: ["overview", "history", "periods"],
    queryFn: () => getHistoryPeriods(userId),
  });

  return (
    <div className="flex flex-wrap items-center gap-4 bg-card/40 backdrop-blur-md rounded-xl p-3 border border-white/10 shadow-sm">
      {/* Tabs chọn khung thời gian */}
      <SkeletonWrapper isLoading={historyPeriods.isFetching} fullWidth={false}>
        <Tabs
          value={timeframe}
          onValueChange={(v) => setTimeframe(v as Timeframe)}
        >
          <TabsList className="rounded-lg bg-background/60 backdrop-blur">
            <TabsTrigger value="year" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" /> Năm
            </TabsTrigger>
            <TabsTrigger value="month" className="flex items-center gap-2">
              <LineChart className="w-4 h-4" /> Tháng
            </TabsTrigger>
            <TabsTrigger value="week" className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4" /> Tuần
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </SkeletonWrapper>

      {/* Select Năm / Tháng / Tuần */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Chọn năm */}
        <SkeletonWrapper
          isLoading={historyPeriods.isFetching}
          fullWidth={false}
        >
          <YearSelector
            period={period}
            setPeriod={setPeriod}
            years={historyPeriods.data || []}
          />
        </SkeletonWrapper>

        {/* Chọn tháng */}
        {(timeframe === "month" || timeframe === "week") && (
          <SkeletonWrapper
            isLoading={historyPeriods.isFetching}
            fullWidth={false}
          >
            <MonthSelector period={period} setPeriod={setPeriod} />
          </SkeletonWrapper>
        )}

        {/* Chọn tuần */}
        {timeframe === "week" && (
          <SkeletonWrapper
            isLoading={historyPeriods.isFetching}
            fullWidth={false}
          >
            <WeekSelector period={period} setPeriod={setPeriod} />
          </SkeletonWrapper>
        )}
      </div>
    </div>
  );
}

export default HistoryPeriodSelector;

// ================== COMPONENT CON ==================

function YearSelector({
  period,
  setPeriod,
  years,
}: {
  period: Period;
  setPeriod: (period: Period) => void;
  years: GetHistoryPeriodsResponseType;
}) {
  return (
    <Select
      value={period.year.toString()}
      onValueChange={(value) => {
        setPeriod({
          ...period,
          year: parseInt(value),
        });
      }}
    >
      <SelectTrigger className="w-[160px] bg-background/60 backdrop-blur-md border border-white/10">
        <SelectValue placeholder="Chọn năm" />
      </SelectTrigger>
      <SelectContent>
        {years.map((year) => (
          <SelectItem key={year} value={year.toString()}>
            {year}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function MonthSelector({
  period,
  setPeriod,
}: {
  period: Period;
  setPeriod: (period: Period) => void;
}) {
  return (
    <Select
      value={period.month?.toString() ?? "0"}
      onValueChange={(value) => {
        setPeriod({
          ...period,
          month: parseInt(value),
        });
      }}
    >
      <SelectTrigger className="w-[160px] bg-background/60 backdrop-blur-md border border-white/10">
        <SelectValue placeholder="Chọn tháng" />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: 12 }, (_, month) => {
          const monthStr = new Date(period.year, month, 1).toLocaleString(
            "vi-VN",
            {
              month: "long",
            }
          );
          return (
            <SelectItem key={month} value={month.toString()}>
              {monthStr}
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}

function WeekSelector({
  period,
  setPeriod,
}: {
  period: Period
  setPeriod: (period: Period) => void
}) {
  // Tính số tuần trong tháng
  const weeksInMonth = getWeeksInMonth(period.year, period.month ?? 0)

  return (
    <Select
      value={period.week?.toString() ?? "1"}
      onValueChange={(value) => {
        setPeriod({
          ...period,
          week: parseInt(value),
        })
      }}
    >
      <SelectTrigger className="w-[160px] bg-background/60 backdrop-blur-md border border-white/10">
        <SelectValue placeholder="Chọn tuần" />
      </SelectTrigger>
      <SelectContent>
        {Array.from({ length: weeksInMonth }, (_, i) => i + 1).map((week) => (
          <SelectItem key={week} value={week.toString()}>
            Tuần {week}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

// Tính số tuần trong tháng
function getWeeksInMonth(year: number, month: number) {
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const firstWeekday = firstDay.getDay() || 7
  const totalDays = lastDay.getDate()
  return Math.ceil((totalDays + firstWeekday - 1) / 7)
}
