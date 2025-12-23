"use client";

import React, { useCallback, useMemo, useState } from "react";
import CountUp from "react-countup";
import { useQuery } from "@tanstack/react-query";
import type { TooltipProps } from "recharts";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import SkeletonWrapper from "@/components/skeletons/wrapper-skeleton";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { getHistoryData } from "@/lib/actions/history";
import { GetFormatterForCurrency } from "@/lib/utils";
import type { Period, Timeframe } from "@/types";
import type { UserSettings } from "@prisma/client";
import { unstable_noStore as noStore } from "next/cache";
import HistoryPeriodSelector from "./history-period-selector";

type HistoryPoint = {
  income: number;
  expense: number;
  year?: number;
  month?: number;
  day?: number;
  label?: string;
};

function History({ userSettings }: { userSettings: UserSettings | null }) {
  if (!userSettings) return null;
  return <HistoryContent userSettings={userSettings} />;
}

function HistoryContent({ userSettings }: { userSettings: UserSettings }) {
  const [timeframe, setTimeframe] = useState<Timeframe>("month");
  const [period, setPeriod] = useState<Period>({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
    week: 1,
  });

  const formatter = useMemo(
    () => GetFormatterForCurrency(userSettings.currency),
    [userSettings.currency]
  );
  const queryKey = useMemo(
    () => [
      "overview",
      "history",
      timeframe,
      period.year,
      period.month ?? null,
      period.week ?? null,
    ],
    [timeframe, period.year, period.month, period.week]
  );

  const historyDataQuery = useQuery<HistoryPoint[]>({
    refetchInterval: 10_000, // 10s
    refetchIntervalInBackground: false,

    queryKey,
    queryFn: async () => {
      const periodData: Period = { year: period.year };

      if (timeframe === "month" || timeframe === "week") {
        periodData.month = period.month!;
      }
      if (timeframe === "week") {
        periodData.week = period.week!;
      }

      const res = await getHistoryData(
        userSettings.userId,
        timeframe,
        periodData
      );
      return (res ?? []) as HistoryPoint[];
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  });

  const data = historyDataQuery.data ?? [];
  const dataAvailable = data.length > 0;

  return (
    <div className="container mt-12">
      <h2 className="text-3xl font-bold mb-4">Lịch sử giao dịch</h2>

      <Card className="relative overflow-hidden rounded-2xl border border-white/10 bg-card/50 backdrop-blur-md">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-indigo-500/20 via-transparent to-purple-500/20 blur-3xl opacity-70" />

        <CardHeader className="gap-2">
          <CardTitle className="grid grid-flow-row justify-between gap-2 md:grid-flow-col">
            <HistoryPeriodSelector
              userId={userSettings.userId}
              period={period}
              setPeriod={setPeriod}
              timeframe={timeframe}
              setTimeframe={setTimeframe}
            />

            <div className="flex h-10 gap-2">
              <Badge
                variant="outline"
                className="flex items-center gap-2 text-sm"
              >
                <div className="h-4 w-4 rounded-full bg-emerald-500" />
                Thu nhập
              </Badge>
              <Badge
                variant="outline"
                className="flex items-center gap-2 text-sm"
              >
                <div className="h-4 w-4 rounded-full bg-red-500" />
                Chi tiêu
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent>
          <SkeletonWrapper isLoading={historyDataQuery.isFetching}>
            {dataAvailable ? (
              <ResponsiveContainer width="100%" height={320}>
                {timeframe === "year" ? (
                  <BarChart data={data} barCategoryGap={8}>
                    <CartesianGrid
                      strokeDasharray="5 5"
                      strokeOpacity={0.15}
                      vertical={false}
                    />
                    <XAxis
                      dataKey={(d: HistoryPoint) =>
                        new Date(d.year ?? 0, d.month ?? 0).toLocaleDateString(
                          "vi-VN",
                          { month: "short" }
                        )
                      }
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="#aaa"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="#aaa"
                    />
                    <Bar dataKey="income" fill="#10b981" radius={4} />
                    <Bar dataKey="expense" fill="#ef4444" radius={4} />
                    <Tooltip
                      content={(p) => (
                        <CustomTooltip
                          moneyFmt={formatter}
                          active={p.active}
                          payload={p.payload}
                        />
                      )}
                    />
                  </BarChart>
                ) : timeframe === "month" ? (
                  <LineChart data={data}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      strokeOpacity={0.15}
                      vertical={false}
                    />
                    <XAxis
                      dataKey={(d: HistoryPoint) =>
                        new Date(
                          d.year ?? 0,
                          d.month ?? 0,
                          d.day ?? 1
                        ).getDate()
                      }
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="#aaa"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="#aaa"
                    />
                    <Tooltip
                      content={(p) => (
                        <CustomTooltip
                          moneyFmt={formatter}
                          active={p.active}
                          payload={p.payload}
                        />
                      )}
                    />

                    <Line
                      type="monotone"
                      dataKey="income"
                      stroke="#10b981"
                      strokeWidth={3}
                      dot={false}
                    />
                    <Line
                      type="monotone"
                      dataKey="expense"
                      stroke="#ef4444"
                      strokeWidth={3}
                      dot={false}
                    />
                  </LineChart>
                ) : (
                  <BarChart data={data} barCategoryGap={10}>
                    <CartesianGrid
                      strokeDasharray="5 5"
                      strokeOpacity={0.15}
                      vertical={false}
                    />
                    <XAxis
                      dataKey={(d: HistoryPoint) => d.label ?? ""}
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="#aaa"
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={false}
                      fontSize={12}
                      stroke="#aaa"
                    />
                    <Bar dataKey="income" fill="#10b981" radius={4} />
                    <Bar dataKey="expense" fill="#ef4444" radius={4} />
                    <Tooltip
                      content={(p) => (
                        <CustomTooltip
                          moneyFmt={formatter}
                          active={p.active}
                          payload={p.payload}
                        />
                      )}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            ) : (
              <Card className="flex h-[300px] flex-col items-center justify-center bg-transparent backdrop-blur-md border border-white/10">
                <p className="text-sm text-center leading-snug break-words max-w-[250px] mx-auto">
                  Không có dữ liệu trong khoảng thời gian đã chọn
                </p>
                <p className="text-sm text-center leading-snug break-words max-w-[250px] mx-auto">
                  Thử chọn một khoảng thời gian khác hoặc thêm giao dịch mới
                </p>
              </Card>
            )}
          </SkeletonWrapper>
        </CardContent>
      </Card>
    </div>
  );
}

export default History;

type CustomTooltipProps = {
  active?: boolean;
  payload?: any[];
  moneyFmt: Intl.NumberFormat;
};

function CustomTooltip({ active, payload, moneyFmt }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null;

  const raw = payload?.[0]?.payload as HistoryPoint | undefined;
  if (!raw) return null;

  const expense = Number(raw.expense ?? 0);
  const income = Number(raw.income ?? 0);

  return (
    <div className="min-w-[280px] rounded-xl border border-white/10 bg-card/80 backdrop-blur-md p-4 shadow-lg">
      <TooltipRow
        label="Chi tiêu"
        value={expense}
        color="#ef4444"
        moneyFmt={moneyFmt}
      />
      <TooltipRow
        label="Thu nhập"
        value={income}
        color="#10b981"
        moneyFmt={moneyFmt}
      />
      <TooltipRow
        label="Số dư"
        value={income - expense}
        color="#a78bfa"
        moneyFmt={moneyFmt}
      />
    </div>
  );
}

function TooltipRow({
  label,
  value,
  color,
  moneyFmt,
}: {
  label: string;
  value: number;
  color: string;
  moneyFmt: Intl.NumberFormat;
}) {
  return (
    <div className="flex items-center justify-between mb-1">
      <span className="flex items-center gap-2">
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: color }}
        />
        <span className="text-sm text-muted-foreground">{label}</span>
      </span>

      <span className="font-semibold" style={{ color }}>
        {moneyFmt.format(Number.isFinite(value) ? value : 0)}
      </span>
    </div>
  );
}
