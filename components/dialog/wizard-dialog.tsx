"use client";

import { useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrencyComboBox } from "@/components/app-logic/currency-combobox";
import { updateFirstLogin } from "@/lib/actions/user-setting";
import { CashflowSetting } from "@/app/(lobby)/manage/_components/cashflow-setting";

interface WizardUser {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
}

interface WizardSettings {
  monthlyBudget?: number | null;
  currency?: string | null;
  firstLogin?: boolean | null;
}

export function WizardDialog({
  user,
  settings,
}: {
  user: WizardUser;
  settings: WizardSettings | null;
}) {
  const [open, setOpen] = useState(true);
  const [income, setIncome] = useState<number>(settings?.monthlyBudget ?? 0);

  const submitIncomeRef = useRef<null | (() => Promise<void>)>(null);

  const canFinish = Number.isFinite(income) && income >= 0;

  async function finishWizard() {
    if (submitIncomeRef.current) {
      await submitIncomeRef.current();
    }
    await updateFirstLogin(user.id);
    setOpen(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl w-full p-0 overflow-hidden rounded-xl">
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
        <div className="max-h-[60vh] overflow-y-auto px-6 py-4 space-y-6">
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

          <CashflowSetting
            userId={user.id}
            currency={settings?.currency || "VND"}
            currentIncome={settings?.monthlyBudget ?? 0}
            hideSaveButton
            onIncomeChange={setIncome}
            registerSubmit={(fn) => {
              submitIncomeRef.current = fn;
            }}
          />
        </div>

        {/* Footer */}
        <div className="p-6 border-t space-y-4">
          <Button
            className="w-full h-12 text-base font-medium"
            onClick={finishWizard}
            disabled={!canFinish}
          >
            Tôi đã xong!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
