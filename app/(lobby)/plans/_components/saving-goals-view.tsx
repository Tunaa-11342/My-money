"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { CreatePlanDialog } from "@/components/dialog/create-plan-dialog";
import { SavingGoalCard } from "./saving-goal-card";
import {
  getUserSavingGoals,
  toggleSavingGoalPinned,
  deleteSavingGoal,
} from "@/lib/actions/saving-goals";

export function SavingGoalsView({ userId }: { userId: string }) {
  const qc = useQueryClient();

  const { data = [], isLoading } = useQuery({
    queryKey: ["saving-goals", userId],
    queryFn: () => getUserSavingGoals(userId),
  });

  const pinMut = useMutation({
    mutationFn: ({ id, pinned }: { id: string; pinned: boolean }) =>
      toggleSavingGoalPinned(userId, id, pinned),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saving-goals", userId] });
      qc.invalidateQueries({ queryKey: ["dashboard", "pinnedPlans", userId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Không ghim được"),
  });

  const delMut = useMutation({
    mutationFn: (id: string) => deleteSavingGoal(userId, id),
    onSuccess: () => {
      toast.success("Đã xóa mục tiêu");
      qc.invalidateQueries({ queryKey: ["saving-goals", userId] });
      qc.invalidateQueries({ queryKey: ["dashboard", "pinnedPlans", userId] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Xóa thất bại"),
  });

  if (isLoading)
    return <div className="text-sm text-muted-foreground">Đang tải...</div>;

  if (data.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-lg font-semibold">
              Chưa có mục tiêu tiết kiệm
            </div>
            <div className="mt-1 text-sm text-muted-foreground">
              Tạo mục tiêu để theo dõi tiến độ và ghim lên Dashboard.
            </div>
          </div>
          <CreatePlanDialog userId={userId} triggerText="Tạo mục tiêu" />
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {data.map((g) => (
        <SavingGoalCard
          key={g.id}
          goal={g}
          onTogglePin={(id: string, pinned: boolean) =>
            pinMut.mutate({ id, pinned })
          }
          onDelete={(id: string) => delMut.mutate(id)}
        />
      ))}
    </div>
  );
}
