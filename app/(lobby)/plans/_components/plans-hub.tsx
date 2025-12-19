"use client";

import { useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PiggyBank, HandCoins, Wallet, Sparkles } from "lucide-react";

import { PlansView } from "./plans-view";
import { SavingGoalsView } from "./saving-goals-view";
import { DebtPlansView } from "./debt-plans-view";
import { CreatePlanDialog } from "@/components/dialog/create-plan-dialog";

type TabKey = "spending" | "saving" | "debt";

export function PlansHub({ userId }: { userId: string }) {
  const [tab, setTab] = useState<TabKey>("spending");

  const header = useMemo(() => {
    if (tab === "spending") {
      return {
        title: "Kế hoạch chi tiêu",
        desc: "Theo dõi ngân sách theo tuần / tháng / quý / năm và ghim lên Dashboard.",
        badge: "Chi tiêu",
        icon: Wallet,
      };
    }
    if (tab === "saving") {
      return {
        title: "Mục tiêu tiết kiệm",
        desc: "Theo dõi tiến độ tích lũy cho mục tiêu dài hạn.",
        badge: "Tiết kiệm",
        icon: PiggyBank,
      };
    }
    return {
      title: "Vay / Nợ",
      desc: "Quản lý khoản vay/nợ theo loại: thu nợ, đi vay, cho vay, trả nợ.",
      badge: "Vay/Nợ",
      icon: HandCoins,
    };
  }, [tab]);

  const Icon = header.icon;

  return (
    <div className="space-y-6">
      {/* Header card */}
      <Card className="relative overflow-hidden rounded-2xl border-white/10 bg-card/50 backdrop-blur-md">
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-emerald-500/10" />
        <CardContent className="relative flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <div className="h-11 w-11 rounded-2xl bg-muted/30 flex items-center justify-center border border-border/60">
              <Icon className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xl font-semibold leading-tight">{header.title}</h2>
                <Badge variant="outline">{header.badge}</Badge>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">{header.desc}</p>
            </div>
          </div>

          {/* CTA */}
          <div className="flex items-center gap-2">
            <CreatePlanDialog userId={userId} triggerVariant="primary" triggerText="Tạo kế hoạch" />
            <Button variant="outline" className="gap-2" onClick={() => setTab("spending")}>
              <Sparkles className="h-4 w-4" />
              Gợi ý
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Domain Tabs */}
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="spending" className="gap-2">
            <Wallet className="h-4 w-4" />
            Chi tiêu
          </TabsTrigger>
          <TabsTrigger value="saving" className="gap-2">
            <PiggyBank className="h-4 w-4" />
            Tiết kiệm
          </TabsTrigger>
          <TabsTrigger value="debt" className="gap-2">
            <HandCoins className="h-4 w-4" />
            Vay/Nợ
          </TabsTrigger>
        </TabsList>

        <TabsContent value="spending" className="space-y-4">
          <PlansView userId={userId} />
        </TabsContent>

        <TabsContent value="saving" className="space-y-4">
          <SavingGoalsView userId={userId} />
        </TabsContent>

        <TabsContent value="debt" className="space-y-4">
          <DebtPlansView userId={userId} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
