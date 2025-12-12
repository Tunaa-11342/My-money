// app/(lobby)/plans/_components/PlansClientPage.tsx
"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { getPlannedSpendings, GetPlannedSpendingsResponseType } from "@/lib/actions/planned-spending";
import SkeletonWrapper from "@/components/skeletons/wrapper-skeleton";
import ActivePlansTab from "./ActivePlansTab";
import AllPlansTab from "./AllPlansTab";

interface Props {
  userId: string;
}

export default function PlansClientPage({ userId }: Props) {
  const [tab, setTab] = useState<"active" | "all">("active");

  const { data: plans = [], isFetching } = useQuery<GetPlannedSpendingsResponseType>({
    queryKey: ["plans", userId],
    queryFn: () => getPlannedSpendings(userId),
  });

  const activePlans = plans.filter((p) => p.isActive);
  const allPlans = plans;

  return (
    <div className="h-full bg-background">
      <div className="border-b bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-6 py-8">
          <p className="text-3xl font-bold">Kế hoạch chi tiêu</p>
        </div>
      </div>

      <div className="container py-6">
        <SkeletonWrapper isLoading={isFetching}>
          <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
            <TabsList>
              <TabsTrigger value="active">Đang thực hiện</TabsTrigger>
              <TabsTrigger value="all">Toàn bộ kế hoạch</TabsTrigger>
            </TabsList>

            <TabsContent value="active">
              <ActivePlansTab plans={activePlans} userId={userId} />
            </TabsContent>

            <TabsContent value="all">
              <AllPlansTab plans={allPlans} userId={userId} />
            </TabsContent>
          </Tabs>
        </SkeletonWrapper>
      </div>
    </div>
  );
}
