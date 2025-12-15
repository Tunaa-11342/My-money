"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  AlertCircle,
  Pin,
  Wallet,
  PiggyBank,
  HandCoins,
  CheckCircle2,
  ArrowUpRight,
} from "lucide-react";

import SkeletonWrapper from "@/components/skeletons/wrapper-skeleton";
import { cn, GetFormatterForCurrency } from "@/lib/utils";

import { getPinnedPlansForDashboard } from "@/lib/actions/planned-spending";
import { getUserSavingGoals } from "@/lib/actions/saving-goals";
import { getUserDebtPlans } from "@/lib/actions/debts";

import type { UserSettings } from "@prisma/client";

type Kind = "spending" | "saving" | "debt";

type PinnedItem = {
  kind: Kind;
  id: string;
  title: string;

  pill: string; // e.g. "72%" or "Thu nợ"
  right: string; // e.g. "1.2m / 3m" or "12m"
  done?: boolean;

  percent?: number;

  // Sorting
  createdAt?: string | null;
};

function debtCategoryLabel(c: any) {
  switch (c) {
    case "COLLECT":
      return "Thu nợ";
    case "BORROW":
      return "Đi vay";
    case "LEND":
      return "Cho vay";
    case "REPAY":
      return "Trả nợ";
    default:
      return "Vay/Nợ";
  }
}

function kindMeta(kind: Kind) {
  if (kind === "spending") return { icon: Wallet, chip: "Chi tiêu" };
  if (kind === "saving") return { icon: PiggyBank, chip: "Tiết kiệm" };
  return { icon: HandCoins, chip: "Vay/Nợ" };
}

function clampPercent(n: number) {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, n));
}

function shortMoney(n: number) {
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}b`;
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}m`;
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return `${n}`;
}

function Row({
  item,
}: {
  item: PinnedItem;
}) {
  const { icon: Icon } = kindMeta(item.kind);

  const percent = item.percent == null ? undefined : clampPercent(item.percent);
  const showFill = typeof percent === "number";

  return (
    <div className="group relative overflow-hidden rounded-lg border bg-muted/20 px-3 py-2 transition hover:bg-muted/30">
      {showFill && (
        <div
          className="pointer-events-none absolute inset-y-0 left-0 bg-primary/10"
          style={{ width: `${percent}%` }}
        />
      )}

      <div className="relative flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border bg-background/40">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium leading-tight">
            {item.title}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-md border bg-background/40 px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
            {item.pill}
          </span>

          <span className="hidden sm:inline text-xs text-muted-foreground tabular-nums">
            {item.right}
          </span>

          {item.done ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          ) : (
            <span className="h-4 w-4" />
          )}
        </div>
      </div>
    </div>
  );
}

interface PlannedSpendingDashboardWidgetProps {
  userSettings: UserSettings;
}

export function PlannedSpendingDashboardWidget({
  userSettings,
}: PlannedSpendingDashboardWidgetProps) {
  const userId = userSettings.userId;
  const fmt = GetFormatterForCurrency(userSettings.currency);

  const spendingQ = useQuery({
    queryKey: ["dashboard", "pinnedPlans", userId, "spending"],
    queryFn: () => getPinnedPlansForDashboard(userId),
  });

  const savingQ = useQuery({
    queryKey: ["dashboard", "pinnedPlans", userId, "saving"],
    queryFn: async () => {
      const all = await getUserSavingGoals(userId);
      return (all ?? []).filter((x: any) => !!x.pinned);
    },
  });

  const debtQ = useQuery({
    queryKey: ["dashboard", "pinnedPlans", userId, "debt"],
    queryFn: async () => {
      const all = await getUserDebtPlans(userId);
      return (all ?? []).filter((x: any) => !!x.pinned);
    },
  });

  const isFetching = spendingQ.isFetching || savingQ.isFetching || debtQ.isFetching;

  const items: PinnedItem[] = useMemo(() => {
    const spending = (spendingQ.data ?? []).map((p: any) => {
      const percent = clampPercent(p.progressPercent ?? 0);
      const done = percent >= 100;

      const right = `${shortMoney(p.actualSpending ?? 0)} / ${shortMoney(p.totalBudget ?? 0)}`;

      return {
        kind: "spending" as const,
        id: p.id,
        title: p.name,
        pill: `${Math.round(percent)}%`,
        right,
        done,
        percent,
        createdAt: p.createdAt ?? null,
      };
    });

    const saving = (savingQ.data ?? []).map((g: any) => {
      const percent =
        g.targetAmount && g.targetAmount > 0
          ? (g.currentAmount / g.targetAmount) * 100
          : 0;

      const pct = clampPercent(percent);
      const done = pct >= 100;

      const right = `${shortMoney(g.currentAmount ?? 0)} / ${shortMoney(g.targetAmount ?? 0)}`;

      return {
        kind: "saving" as const,
        id: g.id,
        title: g.title,
        pill: `${Math.round(pct)}%`,
        right,
        done,
        percent: pct,
        createdAt: g.createdAt ?? null,
      };
    });

    const debt = (debtQ.data ?? []).map((d: any) => {
      const right = shortMoney(d.amount ?? 0);
      return {
        kind: "debt" as const,
        id: d.id,
        title: d.title,
        pill: debtCategoryLabel(d.category),
        right,
        done: false,
        createdAt: d.createdAt ?? null,
      };
    });

    const merged = [...spending, ...saving, ...debt].sort((a, b) => {
      const ta = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const tb = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return tb - ta;
    });

    return merged.slice(0, 8);
  }, [spendingQ.data, savingQ.data, debtQ.data]);

  return (
    <SkeletonWrapper isLoading={isFetching}>
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg border bg-muted/30">
              <Pin className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="min-w-0">
              <div className="truncate font-semibold">Kế hoạch đang ghim</div>
              <div className="text-xs text-muted-foreground">
                Hiển thị nhanh các mục quan trọng.
              </div>
            </div>
          </div>

          <Link
            href="/plans"
            className={cn(
              "group inline-flex items-center gap-1 rounded-lg border bg-background/40 px-2 py-1 text-xs",
              "text-muted-foreground hover:text-foreground hover:bg-muted/30"
            )}
          >
            Quản lý <ArrowUpRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="mt-4 space-y-2">
          {items.length === 0 ? (
            <div className="rounded-lg border border-dashed p-4 text-center">
              <AlertCircle className="mx-auto h-5 w-5 text-muted-foreground" />
              <div className="mt-2 text-sm font-medium">
                Chưa có kế hoạch nào được ghim
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Vào tab Kế hoạch để ghim mục tiêu bạn muốn theo dõi.
              </div>
            </div>
          ) : (
            items.map((it) => <Row key={`${it.kind}-${it.id}`} item={it} />)
          )}

          {/* hint tiền tệ (nhỏ thôi, không phá layout) */}
          {items.length > 0 && (
            <div className="pt-1 text-[11px] text-muted-foreground">
              Đơn vị: {userSettings.currency} • Ví dụ hiển thị: {fmt.format(1_000_000)}
            </div>
          )}
        </div>
      </div>
    </SkeletonWrapper>
  );
}
