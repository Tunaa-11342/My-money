"use client";

import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

import { updateUserBudget } from "@/lib/actions/user-setting";
import { getCashflowSummary, type CashflowSummary } from "@/lib/actions/cashflow";

interface CashflowSettingProps {
  userId: string;
  currentIncome: number; // userSettings.monthlyBudget
  currency: string;
}

export function CashflowSetting({ userId, currentIncome, currency }: CashflowSettingProps) {
  const queryClient = useQueryClient();
  const [income, setIncome] = useState(String(currentIncome ?? 0));
  const [saving, setSaving] = useState(false);

  const fmt = useMemo(() => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency,
    });
  }, [currency]);

  const cashflowQuery = useQuery<CashflowSummary>({
    queryKey: ["cashflowSummary", userId],
    queryFn: () => getCashflowSummary(userId, 6),
  });

  const handleSaveIncome = async () => {
    setSaving(true);
    try {
      const v = Number(income);
      if (Number.isNaN(v) || v < 0) {
        toast.error("Vui lòng nhập số tiền hợp lệ");
        return;
      }

      await updateUserBudget(userId, v);
      toast.success("Đã cập nhật thu nhập cố định hàng tháng");

      // refresh
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
      queryClient.invalidateQueries({ queryKey: ["cashflowSummary", userId] });
      queryClient.invalidateQueries({ queryKey: ["currentMonthSpending"] });
    } catch (e) {
      console.error(e);
      toast.error("Có lỗi xảy ra khi cập nhật");
    } finally {
      setSaving(false);
    }
  };

  const summary = cashflowQuery.data;

  const warningText =
    summary?.warnings.negativeMonths?.length
      ? `⚠️ Tháng bị âm dòng tiền: ${summary.warnings.negativeMonths.join(", ")}`
      : null;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Cashflow (Nguồn tiền)</CardTitle>
        <CardDescription>
          Quản lý theo <b>thu nhập cố định/tháng</b> + <b>kế hoạch chi tiêu tương lai</b> +{" "}
          <b>mục tiêu tiết kiệm</b> để xem trước tháng nào thiếu tiền.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Fixed income input */}
        <div className="space-y-2">
          <Label htmlFor="fixedIncome">Thu nhập cố định / tháng</Label>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              id="fixedIncome"
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="VD: 3000000"
            />
            <Button onClick={handleSaveIncome} disabled={saving}>
              {saving ? "Đang lưu..." : "Lưu"}
            </Button>
          </div>

          {currentIncome > 0 ? (
            <p className="text-sm text-muted-foreground">
              Hiện tại: <b>{fmt.format(currentIncome)}</b> / tháng
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Tip: set thu nhập cố định để forecast hoạt động đúng.
            </p>
          )}
        </div>

        <Separator />

        {/* Summary */}
        {cashflowQuery.isLoading ? (
          <div className="text-sm text-muted-foreground">Đang tải cashflow...</div>
        ) : summary ? (
          <div className="space-y-4">
            {warningText ? (
              <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm">
                {warningText}
              </div>
            ) : (
              <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm">
                ✅ 6 tháng tới chưa thấy tháng nào âm (theo dữ liệu kế hoạch hiện tại).
              </div>
            )}

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border bg-card p-4">
                <div className="text-xs text-muted-foreground">Thu nhập cố định</div>
                <div className="mt-1 text-lg font-semibold">{fmt.format(summary.fixedIncome)}</div>
              </div>

              <div className="rounded-xl border bg-card p-4">
                <div className="text-xs text-muted-foreground">
                  Chi tiêu thực tế ({summary.currentMonthKey})
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {fmt.format(summary.currentMonthActualExpense)}
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4">
                <div className="text-xs text-muted-foreground">
                  Kế hoạch chi ({summary.currentMonthKey})
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {fmt.format(summary.currentMonthPlannedSpending)}
                </div>
              </div>

              <div className="rounded-xl border bg-card p-4">
                <div className="text-xs text-muted-foreground">
                  Tiết kiệm gợi ý ({summary.currentMonthKey})
                </div>
                <div className="mt-1 text-lg font-semibold">
                  {fmt.format(summary.currentMonthGoalSaving)}
                </div>
              </div>
            </div>

            <Separator />

            {/* Forecast list */}
            <div className="space-y-2">
              <div className="font-semibold">Forecast {summary.forecastMonths} tháng</div>
              <div className="space-y-2">
                {summary.forecast.map((row) => {
                  const isNeg = row.net < 0;
                  return (
                    <div
                      key={row.monthKey}
                      className="flex flex-col gap-2 rounded-xl border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="text-base font-semibold">{row.monthKey}</div>
                        <div className="mt-1 text-xs text-muted-foreground">
                          Thu nhập: {fmt.format(row.income)} • Kế hoạch chi:{" "}
                          {fmt.format(row.plannedSpending)} • Tiết kiệm gợi ý:{" "}
                          {fmt.format(row.goalSaving)}
                        </div>
                      </div>

                      <div className={`text-lg font-semibold ${isNeg ? "text-rose-500" : "text-emerald-600"}`}>
                        Net: {fmt.format(row.net)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-xs text-muted-foreground">
                * Kế hoạch chi lấy từ <b>Planned Spending</b> (tự phân bổ theo tháng nếu plan span nhiều tháng).
                Tiết kiệm gợi ý lấy từ <b>Saving Goal (pinned)</b> chia đều theo số tháng còn lại tới targetDate.
              </p>
            </div>
          </div>
        ) : (
          <div className="text-sm text-muted-foreground">Không có dữ liệu cashflow.</div>
        )}
      </CardContent>
    </Card>
  );
}
