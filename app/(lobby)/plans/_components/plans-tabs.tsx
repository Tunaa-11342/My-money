"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CreatePlanDialog } from "@/components/dialog/create-plan-dialog";
import { PlansView } from "./plans-view";
import { SavingGoalsView } from "./saving-goals-view";
import { DebtPlansView } from "./debt-plans-view";

export function PlansTabs({ userId }: { userId: string }) {
  return (
    <div className="container space-y-6 py-6">
      <div className="flex flex-col gap-3 rounded-xl border bg-card p-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-xl font-semibold">Kế hoạch</div>
          <div className="mt-1 text-sm text-muted-foreground">
            Quản lý 3 loại: chi tiêu, tiết kiệm và vay/nợ.
          </div>
        </div>
        <div className="flex gap-2">
          <CreatePlanDialog userId={userId} />
        </div>
      </div>

      <Tabs defaultValue="spending" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="spending">Chi tiêu</TabsTrigger>
          <TabsTrigger value="saving">Tiết kiệm</TabsTrigger>
          <TabsTrigger value="debt">Vay/Nợ</TabsTrigger>
        </TabsList>

        <TabsContent value="spending" className="mt-4">
          <PlansView userId={userId} />
        </TabsContent>

        <TabsContent value="saving" className="mt-4">
          <SavingGoalsView userId={userId} />
        </TabsContent>

        <TabsContent value="debt" className="mt-4">
          <DebtPlansView userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
