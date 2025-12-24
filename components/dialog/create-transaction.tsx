"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { DateToUTCDate, cn } from "@/lib/utils";
import { ReactNode, useCallback, useState, useEffect, useMemo } from "react";
import { vi } from "date-fns/locale";
import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { CalendarIcon, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Calendar } from "@/components/ui/calendar";
import { toast } from "sonner";
import { TransactionType } from "@/types";
import {
  CreateTransactionSchema,
  CreateTransactionSchemaType,
} from "@/lib/schemas/transactions";
import CategoryPicker from "./category-picker";
import { createTransaction } from "@/lib/actions/transactions";
import { Progress } from "@/components/ui/progress";

interface Props {
  trigger: ReactNode;
  type: TransactionType;
  userId: string;
}

function CreateTransactionDialog({ trigger, type, userId }: Props) {
  const form = useForm<CreateTransactionSchemaType>({
    resolver: zodResolver(CreateTransactionSchema),
    defaultValues: {
      type,
      date: new Date(),
    },
  });
  const amountWatch = form.watch("amount");
  const dateWatch = form.watch("date");

  const [guard, setGuard] = useState<any>(null);
  const [checking, setChecking] = useState(false);

  const [open, setOpen] = useState(false);
  const handleCategoryChange = useCallback(
    (value: string) => {
      form.setValue("categoryId", value);
    },
    [form]
  );

  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (values: CreateTransactionSchemaType) =>
      createTransaction(userId, values),
    onSuccess: () => {
      toast.success("Giao dịch được tạo thành công 🎉", {
        id: "create-transaction",
      });

      form.reset({
        type,
        description: "",
        amount: 0,
        date: new Date(),
        categoryId: undefined,
      });

      queryClient.invalidateQueries({ queryKey: ["overview"] });
      queryClient.invalidateQueries({ queryKey: ["categoriesStats"] });
      queryClient.invalidateQueries({ queryKey: ["history"] });
      queryClient.invalidateQueries();

      setOpen((prev) => !prev);
    },
  });

  const onSubmit = useCallback(
    (values: CreateTransactionSchemaType) => {
      toast.loading("Creating transaction...", { id: "create-transaction" });
      if (type === "expense" && guard?.ok === false) {
        toast.error(
          `Không thể tạo chi tiêu: vượt ngân sách ${guard.monthKey}`,
          {
            id: "create-transaction",
          }
        );
        return;
      }

      mutate({
        ...values,
        date: DateToUTCDate(values.date),
      });
    },
    [mutate]
  );

  useEffect(() => {
    let alive = true;

    async function run() {
      if (type !== "expense") {
        setGuard(null);
        return;
      }

      const amount = Number(amountWatch ?? 0);
      const date = dateWatch ? new Date(dateWatch) : null;

      if (!date || !Number.isFinite(amount) || amount <= 0) {
        setGuard(null);
        return;
      }

      setChecking(true);
      try {
        const res = await fetch("/api/budget/validate-expense", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount, date }),
        });
        const json = await res.json();
        if (!alive) return;
        setGuard(json);
      } catch {
        if (!alive) return;
        setGuard(null);
      } finally {
        if (!alive) return;
        setChecking(false);
      }
    }

    const t = setTimeout(run, 250);
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [type, amountWatch, dateWatch]);
  const disableCreate = useMemo(() => {
    if (type !== "expense") return isPending;
    if (checking) return true;
    if (guard?.ok === false) return true;
    return isPending;
  }, [type, isPending, checking, guard]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Tạo một giao dịch{" "}
            <span
              className={cn(
                "m-1",
                type === "income" ? "text-emerald-500" : "text-red-500"
              )}
            >
              {type === "income" ? "thu nhập" : "chi tiêu"}
            </span>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Input defaultValue={""} {...field} />
                  </FormControl>
                  <FormDescription>
                    Mô tả giao dịch (không bắt buộc)
                  </FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tiền</FormLabel>
                  <FormControl>
                    <Input defaultValue={0} type="number" {...field} />
                  </FormControl>
                  <FormDescription>Số tiền giao dịch (yêu cầu)</FormDescription>
                </FormItem>
              )}
            />
            {type === "expense" && guard?.monthKey && (
              <div
                className={cn(
                  "rounded-2xl border p-4 shadow-sm transition-all",
                  guard?.overBy > 0
                    ? "border-rose-200 bg-rose-50/40"
                    : guard?.nextSpent / guard?.totalBudget >= 0.8
                    ? "border-amber-200 bg-amber-50/40"
                    : "border-emerald-200 bg-emerald-50/40",
                  checking && "opacity-70"
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="font-semibold">
                    {guard?.overBy > 0
                      ? "Vượt ngân sách tháng"
                      : guard?.nextSpent / guard?.totalBudget >= 0.8
                      ? "Sắp chạm trần ngân sách"
                      : "Chi tiêu hợp lệ"}
                  </div>
                  <div className="text-xs text-slate-600">
                    Tháng: <span className="font-medium">{guard.monthKey}</span>
                  </div>
                </div>

                <div className="mt-1 text-sm text-slate-600">
                  Giới hạn theo kế hoạch:{" "}
                  <span className="font-semibold text-slate-800">
                    {Number(
                      guard.limit ?? guard.plannedLimit ?? 0
                    ).toLocaleString("vi-VN")}{" "}
                    đ
                  </span>
                  {" · "}
                  Sau khi thêm:{" "}
                  <span
                    className={cn(
                      "font-semibold",
                      guard?.overBy > 0
                        ? "text-rose-700"
                        : guard?.nextSpent / guard?.totalBudget >= 0.8
                        ? "text-amber-700"
                        : "text-emerald-700"
                    )}
                  >
                    {Number(guard.nextSpent ?? 0).toLocaleString("vi-VN")} đ
                  </span>
                </div>

                <div className="mt-3">
                  <Progress
                    value={
                      (guard.limit ?? guard.plannedLimit ?? 0) > 0
                        ? Math.min(
                            150,
                            (guard.nextSpent /
                              (guard.limit ?? guard.plannedLimit)) *
                              100
                          )
                        : 0
                    }
                    className="h-2"
                  />

                  <div className="mt-2 flex items-center justify-between text-xs text-slate-600">
                    <span>
                      {(guard.limit ?? guard.plannedLimit ?? 0) > 0
                        ? Math.round(
                            (guard.nextSpent /
                              (guard.limit ?? guard.plannedLimit)) *
                              100
                          )
                        : 0}
                      %
                    </span>

                    {guard.overBy > 0 ? (
                      <span className="font-medium text-rose-700">
                        Vượt {Number(guard.overBy).toLocaleString("vi-VN")} đ
                      </span>
                    ) : (
                      <span className="font-medium">
                        Còn lại{" "}
                        {Math.max(
                          0,
                          Number(guard.limit ?? guard.plannedLimit ?? 0) -
                            Number(guard.nextSpent ?? 0)
                        ).toLocaleString("vi-VN")}{" "}
                        đ
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2">
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Danh mục</FormLabel>
                    <FormControl>
                      <CategoryPicker
                        userId={userId}
                        type={type}
                        onChange={handleCategoryChange}
                      />
                    </FormControl>
                    <FormDescription>
                      Chọn một danh mục cho giao dịch này
                    </FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Ngày giao dịch</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-[200px] pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: vi })
                            ) : (
                              <span>Chọn một ngày</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={(value) => {
                            if (!value) return;
                            field.onChange(value);
                          }}
                          locale={vi}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormDescription>Chọn ngày cho việc này</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </form>
        </Form>
        <DialogFooter>
          <DialogClose asChild>
            <Button
              type="button"
              variant={"secondary"}
              onClick={() => {
                form.reset();
              }}
            >
              Hủy bỏ
            </Button>
          </DialogClose>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={disableCreate}
            className={cn(
              guard?.ok === false &&
                type === "expense" &&
                "bg-rose-600 hover:bg-rose-600/90",
              guard?.ok !== false &&
                type === "expense" &&
                guard?.monthKey &&
                guard?.nextSpent / guard?.totalBudget >= 0.8
                ? "bg-amber-600 hover:bg-amber-600/90"
                : ""
            )}
          >
            {!isPending &&
              (guard?.ok === false && type === "expense"
                ? "Vượt ngân sách"
                : "Tạo mới")}
            {isPending && <Loader2 className="animate-spin" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default CreateTransactionDialog;
