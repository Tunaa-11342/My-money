import Logo from "@/components/app-ui/logo-piggy"
import { getCachedUser } from "@/lib/queries/user"
import { prisma } from "@/lib/prisma"
import { redirect } from "next/navigation"
import React from "react"
import { Separator } from "@/components/ui/separator"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CurrencyComboBox } from "@/components/app-logic/currency-combobox"
import { BudgetSetting } from "@/app/(lobby)/manage/_components/budget-setting"

async function WizardPage() {
  const user = await getCachedUser()
  if (!user) redirect("/signin")

  // 🧩 Lấy thêm thông tin từ bảng UserSettings
  const settings = await prisma.userSettings.findUnique({
    where: { userId: user.id },
  })

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
          Hãy bắt đầu bằng cách thiết lập đơn vị tiền tệ và ngân sách của bạn
        </h2>

        <h3 className="mt-2 text-center text-sm text-muted-foreground">
          Bạn có thể thay đổi các thiết lập này bất cứ lúc nào
        </h3>
      </div>

      <Separator />

      <Card className="w-full">
        <CardHeader>
          <CardTitle>Tiền tệ</CardTitle>
          <CardDescription>Đặt loại tiền tệ mặc định cho các giao dịch</CardDescription>
        </CardHeader>
        <CardContent>
          <CurrencyComboBox userId={user.id} />
        </CardContent>
      </Card>

      <Separator />

      <Card className="w-full">
        <BudgetSetting
          userId={user.id}
          currentBudget={settings?.monthlyBudget ?? 0}
          currency={settings?.currency || "VND"}
        />
      </Card>

      <Separator />

      <Button asChild className="w-full">
        <Link href="/dashboard">Tôi xong rồi! Đưa tôi đến bảng điều khiển</Link>
      </Button>

      <div className="mt-8">
        <Logo />
      </div>
    </div>
  )
}

export default WizardPage
