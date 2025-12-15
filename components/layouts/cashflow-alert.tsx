"use client";

import { useEffect, useMemo, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import { useQuery } from "@tanstack/react-query";

import { getCashflowSummary } from "@/lib/actions/cashflow";

function buildMessage(months: string[]) {
  const top = months.slice(0, 6);
  const more = months.length > 6 ? ` (+${months.length - 6})` : "";
  return `Dòng tiền âm: ${top.join(", ")}${more}.`;
}

export function CashflowAlert() {
  const { user } = useUser();
  const userId = user?.id;

  const summaryQ = useQuery({
    queryKey: ["cashflow", "summary", userId, 6],
    queryFn: () => getCashflowSummary(userId!, 6),
    enabled: !!userId,
    refetchInterval: 10 * 60 * 1000, 
  });

  const lastSentRef = useRef<string>("");

  const negativeMonths = useMemo(() => {
    return summaryQ.data?.warnings?.negativeMonths ?? [];
  }, [summaryQ.data]);

  useEffect(() => {
    if (!negativeMonths.length) return;

    const message = buildMessage(negativeMonths);
    if (lastSentRef.current === message) return;
    lastSentRef.current = message;

    fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    })
      .then(async (res) => {
        if (!res.ok) return;
        window.dispatchEvent(new Event("new-notification"));
      })
      .catch(() => {});
  }, [negativeMonths]);

  return null;
}
