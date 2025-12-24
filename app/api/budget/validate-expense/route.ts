import { NextResponse } from "next/server";
import { getCachedUser } from "@/lib/queries/user";
import { validateExpenseAgainstMonthlyPlan } from "@/lib/actions/expense-budget";

export async function POST(req: Request) {
  const user = await getCachedUser();
  if (!user)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const body = await req.json();

  const amount = Number(body.amount ?? 0);
  const date = new Date(body.date);


  if (!Number.isFinite(amount) || amount <= 0 || isNaN(date.getTime())) {
    return NextResponse.json({ ok: true });
  }

  const v = await validateExpenseAgainstMonthlyPlan({
    userId: user.id,
    amount,
    date,
  });

  return NextResponse.json(v);
}
