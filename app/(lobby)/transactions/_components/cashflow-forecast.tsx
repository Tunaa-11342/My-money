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
import { Button } from "@/components/ui/button";
import { cn, GetFormatterForCurrency } from "@/lib/utils";
import { getCashflowSummary } from "@/lib/actions/cashflow";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type Resp = Awaited<ReturnType<typeof getCashflowSummary>>;

function Stat({
  label,
  value,
  tone = "neutral",
  icon,
}: {
  label: string;
  value: string;
  tone?: "good" | "bad" | "neutral";
  icon?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-background/30 p-4",
        tone === "good" && "border-emerald-500/15",
        tone === "bad" && "border-rose-500/15",
        tone === "neutral" && "border-border/60"
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
              tone === "neutral" &&
                "bg-muted/30 dark:bg-muted/10 text-muted-foreground"
            )}
          >
            {icon}
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function CashflowForecast({ months = 6 }: { months?: number }) {
  const { user } = useUser();
  const userId = user?.id;

  const q = useQuery<Resp>({
    enabled: !!userId,
    queryKey: ["cashflow", "forecast", userId, months],
    queryFn: () => getCashflowSummary(userId!, months),
  });

  const fmt = useMemo(() => GetFormatterForCurrency(q.data?.currency ?? "VND"), [q.data?.currency]);

  const rows = q.data?.forecast ?? [];
  const negCount = q.data?.warnings?.negativeMonths?.length ?? 0;

  const avgRemain = useMemo(() => {
    if (!rows.length) return 0;
    const total = rows.reduce((acc, r) => acc + (r.net ?? 0), 0);
    return total / rows.length;
  }, [rows]);

  const worstMonth = useMemo(() => {
    if (!rows.length) return null;
    let best = rows[0];
    for (const r of rows) {
      if ((r.net ?? 0) < (best.net ?? 0)) best = r;
    }
    return best;
  }, [rows]);

  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  return (
    <Card className="rounded-2xl border-white/10 bg-card/50 backdrop-blur-md">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Dự báo dòng tiền</CardTitle>
          <div className="mt-1 text-sm text-muted-foreground">
            Tổng hợp thu nhập (cố định + phát sinh) + kế hoạch chi + tiết kiệm gợi ý theo từng tháng.
          </div>
        </div>

        <Button variant="outline" size="sm" className="w-fit">
          {months} tháng
        </Button>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Stat
            label="Còn lại trung bình / tháng"
            value={fmt.format(avgRemain)}
            tone={avgRemain >= 0 ? "good" : "bad"}
            icon={avgRemain >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          />
          <Stat
            label="Số tháng âm"
            value={`${negCount}/${months}`}
            tone={negCount === 0 ? "good" : "bad"}
            icon={negCount === 0 ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
          />
          <Stat
            label="Tháng tệ nhất"
            value={
              worstMonth
                ? `${worstMonth.monthKey} • ${fmt.format(worstMonth.net ?? 0)}`
                : "—"
            }
            tone={(worstMonth?.net ?? 0) < 0 ? "bad" : "neutral"}
            icon={<Info className="h-4 w-4" />}
          />
        </div>

        <div className="rounded-xl border border-border/60 bg-background/30">
          <div className="p-3">
            {q.isFetching ? (
              <SkeletonWrapper isLoading>
                <div className="h-32" />
              </SkeletonWrapper>
            ) : rows.length === 0 ? (
              <div className="py-10 text-center text-sm text-muted-foreground">
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
                            "grid grid-cols-1 md:grid-cols-12 gap-2 rounded-xl border border-border/60 bg-background/30 px-3 py-3",
                            isNeg && "border-rose-500/20"
                          )}
                        >
                          {/* Month */}
                          <div className="md:col-span-2 flex items-center justify-between md:justify-start">
                            <div className="font-semibold">{m.monthKey}</div>

                            {/* Mobile chevron */}
                            <div className="md:hidden">
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon">
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

                          {/* Income */}
                          <div className="md:col-span-2 text-right">
                            <div className="text-xs text-muted-foreground md:hidden">
                              Thu nhập
                            </div>
                            <div className="font-semibold">{fmt.format(m.income ?? 0)}</div>
                          </div>

                          {/* Planned */}
                          <div className="md:col-span-3 text-right">
                            <div className="text-xs text-muted-foreground md:hidden">
                              Kế hoạch chi
                            </div>
                            <div className="font-semibold">
                              {fmt.format(m.plannedSpending ?? 0)}
                            </div>
                          </div>

                          {/* Suggested saving */}
                          <div className="md:col-span-3 text-right">
                            <div className="text-xs text-muted-foreground md:hidden">
                              Tiết kiệm gợi ý
                            </div>
                            <div className="font-semibold">
                              {fmt.format(m.goalSaving ?? 0)}
                            </div>
                          </div>

                          {/* Remain + desktop chevron */}
                          <div className="md:col-span-2 flex items-center justify-between md:justify-end gap-2">
                            <div className="text-xs text-muted-foreground md:hidden">
                              Còn lại
                            </div>
                            <div
                              className={cn(
                                "font-semibold",
                                isNeg ? "text-rose-400" : "text-emerald-400"
                              )}
                            >
                              {fmt.format(remain)}
                            </div>

                            <div className="hidden md:block">
                              <CollapsibleTrigger asChild>
                                <Button variant="ghost" size="icon">
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

                        </div>

                        <CollapsibleContent>
                          <div className="px-3 pb-4 pt-1">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              <div className="rounded-xl border border-border/60 bg-muted/30 dark:bg-muted/10 p-3">
                                <div className="text-xs text-muted-foreground">
                                  Thu nhập
                                </div>
                                <div className="mt-1 font-semibold">
                                  {fmt.format(m.income ?? 0)}
                                </div>
                                {(m.variableIncome ?? 0) !== 0 ? (
                                  <div className="mt-1 text-[11px] text-muted-foreground">
                                    Cố định: {fmt.format(m.fixedIncome ?? 0)} • Phát sinh:{" "}
                                    {fmt.format(m.variableIncome ?? 0)}
                                  </div>
                                ) : null}
                              </div>

                              <div className="rounded-xl border border-border/60 bg-muted/30 dark:bg-muted/10 p-3">
                                <div className="text-xs text-muted-foreground">
                                  Kế hoạch chi
                                </div>
                                <div className="mt-1 font-semibold">
                                  {fmt.format(m.plannedSpending ?? 0)}
                                </div>
                              </div>

                              <div className="rounded-xl border border-border/60 bg-muted/30 dark:bg-muted/10 p-3">
                                <div className="text-xs text-muted-foreground">
                                  Tiết kiệm gợi ý
                                </div>
                                <div className="mt-1 font-semibold">
                                  {fmt.format(m.goalSaving ?? 0)}
                                </div>
                              </div>
                            </div>

                            <div className="mt-3 rounded-xl border border-border/60 bg-emerald-500/5 p-3">
                              <div className="text-xs text-muted-foreground">
                                Còn lại
                              </div>
                              <div className="mt-1 text-sm text-muted-foreground">
                                Còn lại = Thu nhập − Kế hoạch chi − Tiết kiệm gợi ý
                              </div>
                              <div
                                className={cn(
                                  "mt-2 text-right font-semibold",
                                  isNeg ? "text-rose-400" : "text-emerald-400"
                                )}
                              >
                                {fmt.format(remain)}
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </Collapsible>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
