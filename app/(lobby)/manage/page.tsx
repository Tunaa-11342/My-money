import { CurrencyComboBox } from "@/components/app-logic/currency-combobox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getCachedUser } from "@/lib/queries/user";
import { getCreateUserSetting } from "@/lib/actions/user-setting";
import { redirect } from "next/navigation";
import React from "react";
import { CategoryList } from "./_components/category-list";
import { CashflowSetting } from "./_components/cashflow-setting";

async function ManagePage() {
  const user = await getCachedUser();
  if (!user) redirect("/signin");

  const userSettings = await getCreateUserSetting(user.id);

  return (
    <>
      {/* HEADER */}
      <div className="border-b bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-6 py-8">
          <div>
            <p className="text-3xl font-bold">Cài đặt</p>
            <p className="text-muted-foreground">
              Tiền tệ • Cashflow (nguồn tiền) • Danh mục thu/chi
            </p>
          </div>
        </div>
      </div>
      {/* END HEADER */}

      <div className="container flex flex-col gap-4 p-4">
        {/* Currency */}
        <Card>
          <CardHeader>
            <CardTitle>Tiền tệ</CardTitle>
            <CardDescription>Chọn loại tiền tệ hiển thị trong app</CardDescription>
          </CardHeader>
          <CardContent>
            <CurrencyComboBox userId={user.id} />
          </CardContent>
        </Card>
        {userSettings ? (
          <CashflowSetting
            userId={user.id}
            currentIncome={userSettings?.monthlyBudget ?? 0}
            currency={userSettings?.currency ?? "VND"}
          />
        ) : null}
        <CategoryList userId={user.id} type="income" />
        <CategoryList userId={user.id} type="expense" />
      </div>
    </>
  );
}

export default ManagePage;
