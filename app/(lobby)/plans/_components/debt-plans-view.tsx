"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import type { DebtPlanItem } from "@/types";
import {
  getUserDebtPlans,
  toggleDebtPlanPinned,
  deleteDebtPlan,
} from "@/lib/actions/debts";
import { DebtPlanCard } from "./debt-plans-card";
import { CreatePlanDialog } from "@/components/dialog/create-plan-dialog";

export function DebtPlansView({ userId }: { userId: string }) {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["debt-plans", userId],
    queryFn: () => getUserDebtPlans(userId),
  });

  const pinMut = useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) =>
      toggleDebtPlanPinned(userId, id, pinned),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["debt-plans", userId] }),
    onError: (e: any) => toast.error(e?.message ?? "Không ghim được"),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => deleteDebtPlan(userId, id),
    onSuccess: () => {
      toast.success("Đã xóa khoản vay/nợ");
      qc.invalidateQueries({ queryKey: ["debt-plans", userId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Xóa thất bại"),
  });

  if (isLoading)
    return <div className="text-sm text-muted-foreground">Đang tải...</div>;

  const plans = (data ?? []) as DebtPlanItem[];

  if (plans.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">Chưa có khoản vay/nợ</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Danh sách thu nợ / đi vay / cho vay / trả nợ sẽ hiển thị ở đây.
            </div>
          </div>
          <CreatePlanDialog userId={userId} triggerText="Tạo vay/nợ" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {plans.map((p) => (
        <DebtPlanCard
          key={p.id}
          plan={p}
          onTogglePin={(id: string, pinned: boolean) =>
            pinMut.mutate({ id, pinned })
          }
          onDelete={(id: string) => delMut.mutate(id)}
        />
      ))}
    </div>
  );
}
