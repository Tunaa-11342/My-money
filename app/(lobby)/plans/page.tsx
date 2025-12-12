// app/(lobby)/plans/page.tsx
import { redirect } from "next/navigation";
import { CalendarRange } from "lucide-react";

import { getCachedUser } from "@/lib/queries/user";
import { getUserSpendingPlans } from "@/lib/actions/planned-spending";
import { PlanCard } from "./_components/plan-card";
import { CreatePlanDialog } from "@/components/dialog/create-plan-dialog";

export default async function PlansPage() {
  const user = await getCachedUser();
  if (!user) {
    redirect("/signin");
  }

  const plans = await getUserSpendingPlans(user.id);

  return (
    <div className="container py-12">
      {/* Header */}
      <div className="mb-10 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent">
            Kế hoạch chi tiêu
          </h1>
          <p className="mt-1 text-muted-foreground">
            Lập và theo dõi kế hoạch chi tiêu theo năm, quý, tháng hoặc tuần để kiểm soát ngân sách tốt hơn.
          </p>
        </div>

        <div className="flex gap-2">
          <CreatePlanDialog userId={user.id} />
        </div>
      </div>

      {/* Empty state / List */}
      {plans.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-border bg-gradient-to-br from-indigo-500/10 to-purple-500/10 py-24 text-center backdrop-blur-md">
          <CalendarRange className="mb-4 h-16 w-16 text-indigo-400" />
          <h2 className="mb-2 text-xl font-semibold">Chưa có kế hoạch nào</h2>
          <p className="mb-6 max-w-sm text-muted-foreground">
            Hãy tạo kế hoạch chi tiêu đầu tiên để theo dõi ngân sách, đặt mục tiêu và tránh chi tiêu vượt quá giới hạn.
          </p>
          <CreatePlanDialog
            userId={user.id}
            triggerVariant="primary"
            triggerText="Tạo kế hoạch đầu tiên"
          />
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </div>
  );
}
