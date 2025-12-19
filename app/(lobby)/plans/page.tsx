import { redirect } from "next/navigation";
import { PlansHub } from "./_components/plans-hub";
import { syncCurrentUser } from "@/lib/syncUser";

export default async function PlansPage() {
  const user = await syncCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <>
      <div className="border-b bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-6 py-8">
          <div>
            <h1 className="text-3xl font-bold">Kế hoạch</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Quản lý kế hoạch chi tiêu • mục tiêu tiết kiệm • vay/nợ và ghim lên Dashboard.
            </p>
          </div>
        </div>
      </div>

      <div className="container space-y-6 py-6">
        <PlansHub userId={user.id} />
      </div>
    </>
  );
}
