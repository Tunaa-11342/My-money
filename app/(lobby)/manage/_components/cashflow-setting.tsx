"use client";

import React, { useMemo, useState } from "react";
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
}: {
  userId: string;
  currency: string;
  currentIncome: number;
}) {
  const [income, setIncome] = useState<number>(currentIncome ?? 0);

  const fmt = useMemo(() => {
    return GetFormatterForCurrency(currency);
  }, [currency]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      await updateUserBudget(userId, income);
    },
    onSuccess: () => {
      toast.success("Đã lưu thu nhập cố định!");
    },
    onError: () => {
      toast.error("Không lưu được. Thử lại nhé.");
    },
  });

  return (
    <SkeletonWrapper isLoading={saveMutation.isPending}>
      <Card className="border-white/10 bg-card/50 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Nguồn tiền</CardTitle>
          <div className="text-sm text-muted-foreground">
            Thiết lập <b>thu nhập cố định/tháng</b> để hệ thống dùng làm nền cho dự báo dòng tiền.
            (Cảnh báo tháng âm & dự báo 6 tháng đã chuyển sang tab <b>Báo cáo</b>.)
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2">
              <div className="text-sm font-medium">Thu nhập cố định / tháng</div>
              <Input
                type="number"
                value={Number.isFinite(income) ? income : 0}
                onChange={(e) => setIncome(Number(e.target.value || 0))}
                placeholder="Ví dụ: 3000000"
              />
              <div className="text-xs text-muted-foreground">
                Hiện tại: <span className="font-medium">{fmt.format(currentIncome ?? 0)}</span> / tháng
              </div>
            </div>

            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="w-full sm:w-auto"
            >
              Lưu
            </Button>
          </div>
        </CardContent>
      </Card>
    </SkeletonWrapper>
  );
}
