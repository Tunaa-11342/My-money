"use client";

import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MAX_DATE_RANGE_DAYS } from "@/lib/constants";
import { differenceInDays, startOfMonth } from "date-fns";
import React, { useState } from "react";
import { toast } from "sonner";

import TransactionTable from "./_components/TransactionTable";
import { CashflowForecast } from "./_components/cashflow-forecast";

function TransactionsPage() {
  const [tab, setTab] = useState<"cashflow" | "transactions">("transactions");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: new Date(),
  });

  return (
    <>
      <div className="border-b bg-card">
        <div className="container flex flex-wrap items-center justify-between gap-6 py-8">
          <div>
            <p className="text-3xl font-bold">Báo cáo</p>
            <p className="text-sm text-muted-foreground mt-1">
              Xem lịch sử giao dịch và dự báo dòng tiền.
            </p>
          </div>

          {tab === "transactions" && (
            <DateRangePicker
              initialDateFrom={dateRange.from}
              initialDateTo={dateRange.to}
              showCompare={false}
              onUpdate={(values) => {
                const { from, to } = values.range;
                if (!from || !to) return;
                if (differenceInDays(to, from) > MAX_DATE_RANGE_DAYS) {
                  toast.error(
                    `Vùng chọn quá lớn. Vùng chọn tối đa là ${MAX_DATE_RANGE_DAYS} ngày!`
                  );
                  return;
                }
                setDateRange({ from, to });
              }}
            />
          )}
        </div>
      </div>

      <div className="container py-6">
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="space-y-4">
          <TabsList>
            <TabsTrigger value="transactions">Lịch sử giao dịch</TabsTrigger>
            <TabsTrigger value="cashflow">Dòng tiền (Forecast)</TabsTrigger>
          </TabsList>

          <TabsContent value="transactions">
            <TransactionTable from={dateRange.from} to={dateRange.to} />
          </TabsContent>

          <TabsContent value="cashflow" className="space-y-4">
            <CashflowForecast />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

export default TransactionsPage;
