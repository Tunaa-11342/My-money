"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getUserSpendingPlans,
  togglePlanPinned,
} from "@/lib/actions/planned-spending";
import type { SpendingPlan } from "@/types";
import { ActivePlansTab } from "./active-plans-tab";
import { AllPlansTab } from "./all-plans-tab";
import SkeletonWrapper from "@/components/skeletons/wrapper-skeleton";
import { toast } from "sonner";

interface PlansViewProps {
  userId: string;
}

type ViewTab = "active" | "all";

export function PlansView({ userId }: PlansViewProps) {
  const [tab, setTab] = useState<ViewTab>("active");
  const queryClient = useQueryClient();

  const { data: plans = [], isFetching } = useQuery<SpendingPlan[]>({
    queryKey: ["spending-plans", userId],
    queryFn: () => getUserSpendingPlans(userId),
  });

  const pinMutation = useMutation({
    mutationFn: ({ planId, pinned }: { planId: string; pinned: boolean }) =>
      togglePlanPinned(userId, planId, pinned),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spending-plans", userId] });
    },
    onError: () => {
      toast.error("Không cập nhật được trạng thái ghim kế hoạch.");
    },
  });

  const handleTogglePin = (planId: string, pinned: boolean) => {
    pinMutation.mutate({ planId, pinned });
  };

  const activePlans = plans.filter((p) => p.status === "active");

  return (
    <SkeletonWrapper isLoading={isFetching}>
      <Tabs
        value={tab}
        onValueChange={(v) => setTab(v as ViewTab)}
        className="space-y-4"
      >
        <TabsContent value="active">
          <ActivePlansTab
            userId={userId}
            plans={activePlans}
            onTogglePin={handleTogglePin}
          />
        </TabsContent>

        <TabsContent value="all">
          <AllPlansTab
            userId={userId}
            plans={plans}
            onTogglePin={handleTogglePin}
          />
        </TabsContent>
      </Tabs>
    </SkeletonWrapper>
  );
}
