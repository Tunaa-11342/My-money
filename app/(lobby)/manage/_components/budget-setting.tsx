"use client";

import { useState } from "react";
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
import { updateUserBudget } from "@/lib/actions/user-setting";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface BudgetSettingProps {
  userId: string;
  currentBudget: number;
  currency: string;
}

export function BudgetSetting({
  userId,
  currentBudget,
  currency,
}: BudgetSettingProps) {
  const [budget, setBudget] = useState(currentBudget.toString());
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const budgetValue = parseFloat(budget);
      if (isNaN(budgetValue) || budgetValue < 0) {
        toast.error("Vui lòng nhập số tiền hợp lệ");
        return;
      }

      await updateUserBudget(userId, budgetValue);
      toast.success("Đã cập nhật ngân sách hàng tháng");
      setBudget(budgetValue.toString());

      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
      queryClient.invalidateQueries({ queryKey: ["currentMonthSpending"] });
    } catch (error) {
      toast.error("Có lỗi xảy ra khi cập nhật ngân sách");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: currency,
    }).format(amount);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ngân sách hàng tháng</CardTitle>
        <CardDescription>
          Đặt giới hạn chi tiêu hàng tháng để nhận thông báo khi chuẩn bị vượt ngân sách.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="budget">Ngân sách hàng tháng</Label>

          <div className="flex items-center space-x-2">
            <Input
              id="budget"
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="Nhập số tiền."
              min="0"
              step="1000"
            />
            <span className="text-sm text-muted-foreground">{currency}</span>
          </div>

          {currentBudget > 0 && (
            <p className="text-sm text-muted-foreground">
              Ngân sách hiện tại: {formatCurrency(currentBudget)}
            </p>
          )}
        </div>

        <Button onClick={handleSave} disabled={isLoading}>
          {isLoading ? "Đang lưu..." : "Lưu ngân sách"}
        </Button>
      </CardContent>
    </Card>
  );
}
