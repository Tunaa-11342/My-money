"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CurrencyComboBox } from "@/components/app-logic/currency-combobox";
import { BudgetSetting } from "@/app/(lobby)/manage/_components/budget-setting";
import { updateFirstLogin } from "@/lib/actions/user-setting";

interface WizardUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
}

interface WizardSettings {
  monthlyBudget?: number | null;
  currency?: string | null;
}

export function WizardDialog({
  user,
  settings,
}: {
  user: WizardUser;
  settings: WizardSettings | null;
}) {
  const [open, setOpen] = useState(true);

  async function finishWizard() {
    await updateFirstLogin(user.id);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="
          max-w-xl w-full 
          p-0 
          overflow-hidden 
          rounded-xl
        "
      >
        {/* Header */}
        <div className="p-6 pb-4 border-b">
          <DialogHeader className="space-y-1">
            <DialogTitle className="text-xl font-semibold">
              Thiết lập ban đầu
            </DialogTitle>
            <p className="text-sm text-muted-foreground">
              Hoàn thành các bước cấu hình để trải nghiệm ứng dụng tốt hơn.
            </p>
          </DialogHeader>
        </div>

        {/* Scrollable content */}
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-6">
          {/* Currency */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Đơn vị tiền tệ</CardTitle>
              <CardDescription>
                Đặt loại tiền mặc định cho các giao dịch.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CurrencyComboBox userId={user.id} />
            </CardContent>
          </Card>

          {/* Budget */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle>Ngân sách hàng tháng</CardTitle>
              <CardDescription>
                Đặt hạn mức chi tiêu để nhận thông báo khi gần vượt ngân sách.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BudgetSetting
                userId={user.id}
                currentBudget={settings?.monthlyBudget ?? 0}
                currency={settings?.currency || "VND"}
              />
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="p-6 border-t space-y-4">
          <Button
            className="w-full h-12 text-base font-medium"
            onClick={finishWizard}
          >
            Tôi đã xong!
          </Button>

          <div className="flex justify-center opacity-80"></div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
