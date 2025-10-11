import Logo from "@/components/app-ui/logo-piggy";
import { getCachedUser } from "@/lib/queries/user";
import { redirect } from "next/navigation";
import React from "react";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CurrencyComboBox } from "@/components/app-logic/currency-combobox";

async function WizardPage() {
  const user = await getCachedUser();
  if (!user) {
    redirect("/signin");
  }

  return (
    <div className="container flex max-w-2xl flex-col items-center justify-between gap-4">
      <div>
        <h1 className="text-center text-3xl">
          Xin chào,
          <span className="ml-2 font-bold">
            {user.firstName ? user.firstName : "bạn"}! 👋
          </span>
        </h1>
        <h2 className="mt-4 text-center text-base text-muted-foreground">
          Hãy bắt đầu bằng cách thiết lập đơn vị tiền tệ của bạn
        </h2>

        <h3 className="mt-2 text-center text-sm text-muted-foreground">
          Bạn có thể thay đổi các thiết lập này bất cứ lúc nào
        </h3>
      </div>
      <Separator />
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tiền tệ</CardTitle>
          <CardDescription>
            Đặt loại tiền tệ mặc định cho các giao dịch
          </CardDescription>
        </CardHeader>
        <CardContent>
          <CurrencyComboBox userId={user.id} />
        </CardContent>
      </Card>
      <Separator />
      <Link href="/dashboard" className="w-full">
        <Button className="w-full">
          Tôi xong rồi! Đưa tôi đến bảng điều khiển
        </Button>
      </Link>
      <div className="mt-8">
        <Logo />
      </div>
    </div>
  );
}

export default WizardPage;
