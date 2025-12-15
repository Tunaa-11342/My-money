"use client";

import React, { useMemo, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowDownRight,
  ArrowUpRight,
  Info,
  TrendingDown,
  TrendingUp,
  ChevronDown,
} from "lucide-react";

import SkeletonWrapper from "@/components/skeletons/wrapper-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { cn, GetFormatterForCurrency } from "@/lib/utils";
import { getCreateUserSetting } from "@/lib/actions/user-setting";
import { getCashflowSummary } from "@/lib/actions/cashflow";

type Summary = Awaited<ReturnType<typeof getCashflowSummary>>;

function StatPill({
  label,
  value,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: React.ReactNode;
  tone?: "neutral" | "good" | "bad";
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-background/30 p-4",
        tone === "good" && "border-emerald-500/15",
        tone === "bad" && "border-rose-500/15",
        tone === "neutral" && "border-white/10"
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="mt-1 text-lg font-semibold truncate">{value}</div>
        </div>
        {icon ? (
          <div
            className={cn(
              "h-10 w-10 rounded-xl flex items-center justify-center shrink-0",
              tone === "good" && "bg-emerald-500/10 text-emerald-400",
              tone === "bad" && "bg-rose-500/10 text-rose-400",
              tone === "neutral" && "bg-white/5 text-muted-foreground"
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CashflowForecast() {
  const { user } = useUser();
  const userId = user?.id;

  const settingsQ = useQuery({
    queryKey: ["userSettings", userId],
    queryFn: () => getCreateUserSetting(userId!),
    enabled: !!userId,
  });

  const currency = settingsQ.data?.currency ?? "VND";
  const fmt = useMemo(() => GetFormatterForCurrency(currency), [currency]);

  const sumQ = useQuery<Summary>({
    queryKey: ["cashflow", "summary", userId, 6],
    queryFn: () => getCashflowSummary(userId!, 6),
    enabled: !!userId,
  });

  const rows = sumQ.data?.forecast ?? [];
  const negativeMonths = sumQ.data?.warnings?.negativeMonths ?? [];

  const computed = useMemo(() => {
    if (!rows.length) {
      return {
        avgRemain: 0,
        worst: null as null | { monthKey: string; remain: number },
        negCount: 0,
      };
    }

    let total = 0;
    let worst = { monthKey: rows[0].monthKey, remain: Infinity };
    let negCount = 0;

    for (const r of rows) {
      const remain =
        (r.income ?? 0) - (r.plannedSpending ?? 0) - (r.goalSaving ?? 0);
      total += remain;
      if (remain < worst.remain) worst = { monthKey: r.monthKey, remain };
      if (remain < 0) negCount++;
    }

    return {
      avgRemain: total / rows.length,
      worst,
      negCount,
    };
  }, [rows]);

  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  return (
    <SkeletonWrapper isLoading={settingsQ.isFetching || sumQ.isFetching}>
      <Card className="border-white/10 bg-card/50 backdrop-blur-md">
        <CardHeader className="space-y-2">
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>Dự báo dòng tiền</CardTitle>
              <div className="mt-1 text-sm text-muted-foreground">
                Tổng hợp thu nhập cố định + kế hoạch chi + tiết kiệm gợi ý theo
                từng tháng.
              </div>
            </div>
            <Badge variant="secondary">6 tháng</Badge>
          </div>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            <StatPill
              label="Còn lại trung bình / tháng"
              value={fmt.format(computed.avgRemain)}
              tone={computed.avgRemain >= 0 ? "good" : "bad"}
              icon={
                computed.avgRemain >= 0 ? (
                  <TrendingUp className="h-5 w-5" />
                ) : (
                  <TrendingDown className="h-5 w-5" />
                )
              }
            />
            <StatPill
              label="Số tháng âm"
              value={`${computed.negCount}/${rows.length || 6}`}
              tone={computed.negCount === 0 ? "good" : "bad"}
              icon={
                computed.negCount === 0 ? (
                  <ArrowUpRight className="h-5 w-5" />
                ) : (
                  <ArrowDownRight className="h-5 w-5" />
                )
              }
            />
            <StatPill
              label="Tháng tệ nhất"
              value={
                computed.worst
                  ? `${computed.worst.monthKey} • ${fmt.format(
                      computed.worst.remain
                    )}`
                  : "—"
              }
              tone={
                computed.worst && computed.worst.remain < 0 ? "bad" : "neutral"
              }
              icon={<Info className="h-5 w-5" />}
            />
          </div>

          {negativeMonths.length > 0 && (
            <div className="rounded-xl border border-rose-500/15 bg-rose-500/5 p-3 text-sm">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="destructive">Cảnh báo</Badge>
                <span className="text-muted-foreground">
                  Có tháng bị âm:{" "}
                  <span className="text-foreground font-medium">
                    {negativeMonths.slice(0, 8).join(", ")}
                    {negativeMonths.length > 8
                      ? ` (+${negativeMonths.length - 8})`
                      : ""}
                  </span>
                </span>
              </div>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-3">
          {rows.length === 0 ? (
            <div className="rounded-xl border border-dashed border-white/10 p-6 text-center text-sm text-muted-foreground">
              Chưa có dữ liệu dự báo.
            </div>
          ) : (
            <>
              {/* Desktop header (Tailwind chuẩn 12 cột) */}
              <div className="hidden md:grid grid-cols-12 gap-2 px-3 text-xs text-muted-foreground">
                <div className="col-span-2">Tháng</div>
                <div className="col-span-2 text-right">Thu nhập</div>
                <div className="col-span-3 text-right">Kế hoạch chi</div>
                <div className="col-span-3 text-right">Tiết kiệm gợi ý</div>
                <div className="col-span-1 text-left translate-x-36">
                  Còn lại
                </div>
              </div>

              <div className="space-y-2">
                {rows.map((m) => {
                  const remain =
                    (m.income ?? 0) -
                    (m.plannedSpending ?? 0) -
                    (m.goalSaving ?? 0);
                  const isNeg = remain < 0;
                  const isOpen = !!openMap[m.monthKey];

                  return (
                    <Collapsible
                      key={m.monthKey}
                      open={isOpen}
                      onOpenChange={(v) =>
                        setOpenMap((prev) => ({ ...prev, [m.monthKey]: v }))
                      }
                    >
                      <div
                        className={cn(
                          "rounded-xl border bg-background/20 overflow-hidden",
                          isNeg ? "border-rose-500/15" : "border-white/10"
                        )}
                      >
                        {/* ROW */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2 px-3 py-3 items-center">
                          {/* Tháng */}
                          <div className="md:col-span-2 flex items-center justify-between md:justify-start gap-2 min-w-0">
                            <div className="font-semibold truncate">
                              {m.monthKey}
                            </div>
                            <Badge
                              variant="secondary"
                              className={cn(
                                "md:hidden whitespace-nowrap",
                                isNeg &&
                                  "bg-rose-500/10 text-rose-300 border border-rose-500/15"
                              )}
                            >
                              Còn lại {fmt.format(remain)}
                            </Badge>
                          </div>

                          {/* Thu nhập */}
                          <div className="md:col-span-2 md:text-right text-sm min-w-0">
                            <span className="inline-block max-w-full truncate">
                              {fmt.format(m.income ?? 0)}
                            </span>
                          </div>

                          {/* Kế hoạch chi */}
                          <div className="md:col-span-3 md:text-right text-sm min-w-0">
                            <span className="inline-block max-w-full truncate">
                              {fmt.format(m.plannedSpending ?? 0)}
                            </span>
                          </div>

                          {/* Tiết kiệm gợi ý */}
                          <div className="md:col-span-3 md:text-right text-sm min-w-0">
                            <span className="inline-block max-w-full truncate">
                              {fmt.format(m.goalSaving ?? 0)}
                            </span>
                          </div>

                          <div className="md:col-span-2 flex items-center justify-end gap-2 min-w-0">
                            {/* số "Còn lại" */}
                            <div
                              className={cn(
                                "hidden md:flex items-center gap-2 font-semibold whitespace-nowrap",
                                isNeg ? "text-rose-300" : "text-emerald-300"
                              )}
                            >
                              {isNeg ? (
                                <ArrowDownRight className="h-4 w-4" />
                              ) : (
                                <ArrowUpRight className="h-4 w-4" />
                              )}
                              {fmt.format(remain)}
                            </div>

                            {/* Trigger desktop: icon-only */}
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hidden md:inline-flex shrink-0"
                                aria-label="Chi tiết"
                              >
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 transition-transform",
                                    isOpen && "rotate-180"
                                  )}
                                />
                              </Button>
                            </CollapsibleTrigger>

                            {/* Trigger mobile: chữ */}
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="md:hidden gap-2 px-2"
                              >
                                Chi tiết
                                <ChevronDown
                                  className={cn(
                                    "h-4 w-4 transition-transform",
                                    isOpen && "rotate-180"
                                  )}
                                />
                              </Button>
                            </CollapsibleTrigger>
                          </div>
                        </div>

                        {/* CONTENT */}
                        <CollapsibleContent>
                          <div className="px-3 pb-4 pt-1">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="rounded-lg border border-white/10 bg-background/30 p-3">
                                <div className="text-xs text-muted-foreground">
                                  Thu nhập
                                </div>
                                <div className="mt-1 font-semibold">
                                  {fmt.format(m.income ?? 0)}
                                </div>
                              </div>

                              <div className="rounded-lg border border-white/10 bg-background/30 p-3">
                                <div className="text-xs text-muted-foreground">
                                  Kế hoạch chi
                                </div>
                                <div className="mt-1 font-semibold">
                                  {fmt.format(m.plannedSpending ?? 0)}
                                </div>
                              </div>

                              <div className="rounded-lg border border-white/10 bg-background/30 p-3">
                                <div className="text-xs text-muted-foreground">
                                  Tiết kiệm gợi ý
                                </div>
                                <div className="mt-1 font-semibold">
                                  {fmt.format(m.goalSaving ?? 0)}
                                </div>
                              </div>
                            </div>

                            <div
                              className={cn(
                                "mt-3 rounded-lg border p-3",
                                isNeg
                                  ? "border-rose-500/15 bg-rose-500/5"
                                  : "border-emerald-500/15 bg-emerald-500/5"
                              )}
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="text-xs text-muted-foreground">
                                  Còn lại
                                </div>
                                <div
                                  className={cn(
                                    "font-semibold whitespace-nowrap",
                                    isNeg ? "text-rose-300" : "text-emerald-300"
                                  )}
                                >
                                  {fmt.format(remain)}
                                </div>
                              </div>
                              <div className="mt-1 text-xs text-muted-foreground">
                                Còn lại = Thu nhập − Kế hoạch chi − Tiết kiệm
                                gợi ý
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </SkeletonWrapper>
  );
}
