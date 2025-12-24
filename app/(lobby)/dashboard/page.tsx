import { Button } from "@/components/ui/button";
import { getCachedUser } from "@/lib/queries/user";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CreateTransactionDialog from "@/components/dialog/create-transaction";
import Overview from "./_components/overview";
import History from "./_components/history";
import { WizardDialogWrapper } from "@/components/dialog/wizard-dialog-wrapper";
import { ensureMonthlyBudget } from "@/lib/actions/monthly-budget";

export default async function DashboardPage() {
  const rawUser = await getCachedUser();
  if (!rawUser) redirect("/signin");
  await ensureMonthlyBudget(rawUser.id);

  const safeUser = {
    id: rawUser.id,
    firstName: rawUser.firstName ?? null,
    lastName: rawUser.lastName ?? null,
  };

  const rawSettings = await prisma.userSettings.findUnique({
    where: { userId: rawUser.id },
  });

  const safeSettings = rawSettings
    ? {
        id: rawSettings.id,
        userId: rawSettings.userId,
        currency: rawSettings.currency,
        monthlyBudget: rawSettings.monthlyBudget,
        firstLogin: rawSettings.firstLogin,
      }
    : null;

  return (
    <div className="h-full bg-background">
      <WizardDialogWrapper user={safeUser} settings={safeSettings} />

      <div className="border-b bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-6 py-8">
          <p className="text-3xl font-bold">
            Xin chào, {safeUser.firstName}! 👋
          </p>

          <div className="flex items-center gap-3">
            <CreateTransactionDialog
              userId={safeUser.id}
              trigger={
                <Button
                  variant="outline"
                  className="
    border-transparent
    bg-gradient-to-r from-emerald-500/20 to-emerald-400/10
    dark:from-emerald-500/10 dark:to-emerald-400/5

    text-black dark:text-white               /* auto đổi theo theme */

    hover:from-emerald-500/30 hover:to-emerald-400/20
    transition-all
  "
                >
                  Thu nhập
                </Button>
              }
              type="income"
            />

            <CreateTransactionDialog
              userId={safeUser.id}
              trigger={
                <Button
                  variant="outline"
                  className="
                    border-transparent
                    bg-gradient-to-l from-rose-500/20 to-rose-400/10
                    dark:from-rose-500/10 dark:to-rose-400/5
     text-black dark:text-white 
                    hover:from-rose-500/30 hover:to-rose-400/20
                    transition-all
                  "
                >
                  Chi tiêu
                </Button>
              }
              type="expense"
            />
          </div>
        </div>
      </div>

      {safeSettings ? (
        <>
          <Overview userSettings={safeSettings} />
          <History userSettings={safeSettings} />
        </>
      ) : null}
    </div>
  );
}
