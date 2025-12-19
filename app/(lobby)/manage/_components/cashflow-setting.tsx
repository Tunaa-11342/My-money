"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

import SkeletonWrapper from "@/components/skeletons/wrapper-skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { updateUserBudget } from "@/lib/actions/user-setting";
import { GetFormatterForCurrency } from "@/lib/utils";

export function CashflowSetting({
  userId,
  currency,
  currentIncome,
  hideSaveButton = false,
  onSubmit,
  registerSubmit,
  onIncomeChange,
}: {
  userId: string;
  currency: string;
  currentIncome: number;
  hideSaveButton?: boolean; 
  onSubmit?: (income: number) => Promise<void>;
  registerSubmit?: (fn: () => Promise<void>) => void;
  onIncomeChange?: (income: number) => void;
}) {
  const [income, setIncome] = useState<number>(currentIncome ?? 0);

  useEffect(() => {
    setIncome(currentIncome ?? 0);
    onIncomeChange?.(currentIncome ?? 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIncome]);

  const fmt = useMemo(() => {
    return GetFormatterForCurrency(currency);
  }, [currency]);

  const isValid = Number.isFinite(income) && income >= 0;
  const isDirty = income !== (currentIncome ?? 0);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (onSubmit) {
        await onSubmit(income);
        return;
      }
      await updateUserBudget(userId, income);
    },
    onSuccess: () => {
      toast.success("Đã lưu thu nhập cố định!");
    },
    onError: () => {
      toast.error("Không lưu được. Thử lại nhé.");
    },
  });

  useEffect(() => {
    if (!registerSubmit) return;

    registerSubmit(async () => {
      if (!isValid) {
        toast.error("Thu nhập không hợp lệ.");
        return;
      }
      await saveMutation.mutateAsync();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerSubmit, isValid, income, userId, currency]);

  return (
    <SkeletonWrapper isLoading={saveMutation.isPending}>
      <Card className="w-full border-white/10 bg-card/50 backdrop-blur-md">
        <CardHeader className="space-y-2">
          <CardTitle>Nguồn tiền</CardTitle>
          <div className="text-sm text-muted-foreground">
            Thiết lập <b>thu nhập cố định/tháng</b> để hệ thống dùng làm nền cho
            dự báo dòng tiền.
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <div className="text-sm font-medium">Thu nhập cố định / tháng</div>

              <Input
                type="number"
                inputMode="numeric"
                min={0}
                step={1000}
                value={Number.isFinite(income) ? income : 0}
                onChange={(e) => {
                  const raw = e.target.value;
                  const next = raw === "" ? 0 : Number(raw);
                  const safe = Number.isFinite(next) ? Math.max(0, next) : 0;
                  setIncome(safe);
                  onIncomeChange?.(safe);
                }}
                placeholder="Ví dụ: 3000000"
                className="h-11"
              />

              <div className="text-xs text-muted-foreground">
                Hiện tại:{" "}
                <span className="font-medium">{fmt.format(income ?? 0)}</span> /
                tháng
              </div>
            </div>

            {!hideSaveButton && (
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={!isValid || !isDirty || saveMutation.isPending}
                className="h-11 w-full sm:w-auto"
              >
                Lưu
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </SkeletonWrapper>
  );
}
