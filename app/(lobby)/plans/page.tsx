import { redirect } from "next/navigation";
import { PlansHub } from "./_components/plans-hub";
import { syncCurrentUser } from "@/lib/syncUser";

export default async function PlansPage() {
  const user = await syncCurrentUser();
  if (!user) redirect("/sign-in");

  return (
    <div className="container space-y-6 py-10">


      {/* Main content */}
      <PlansHub userId={user.id} />
    </div>
  );
}
