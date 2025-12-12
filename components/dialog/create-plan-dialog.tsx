"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { PlannedPeriodType, DebtCategory } from "@prisma/client";

import { createPlannedSpending } from "@/lib/actions/planned-spending";
import { createSavingGoal } from "@/lib/actions/saving-goals";
import { createDebtPlan } from "@/lib/actions/debts";

type TabKey = "spending" | "saving" | "debt";

const spendingSchema = z
  .object({
    title: z.string().min(1, "Nhập tên kế hoạch"),
    periodType: z.nativeEnum(PlannedPeriodType),
    year: z.coerce.number().int().min(2000).max(2100),
    quarter: z.coerce.number().int().min(1).max(4).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    weekOfYear: z.coerce.number().int().min(1).max(53).optional(),
    targetAmount: z.coerce.number().positive("Số tiền mục tiêu phải lớn hơn 0"),
    categoryId: z.string().optional(),
    isPinned: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.periodType === "QUARTERLY" && !data.quarter)
      ctx.addIssue({ code: "custom", message: "Chọn quý", path: ["quarter"] });
    if (data.periodType === "MONTHLY" && !data.month)
      ctx.addIssue({ code: "custom", message: "Chọn tháng", path: ["month"] });
    if (data.periodType === "WEEKLY" && !data.weekOfYear)
      ctx.addIssue({
        code: "custom",
        message: "Chọn tuần",
        path: ["weekOfYear"],
      });
  });

const savingSchema = z.object({
  title: z.string().min(1),
  targetAmount: z.coerce.number().positive(),
  currentAmount: z.coerce.number().min(0).optional(),
  targetDate: z.string().optional(),
  isPinned: z.boolean().default(false),
});

const debtSchema = z.object({
  title: z.string().min(1),
  category: z.nativeEnum(DebtCategory),
  amount: z.coerce.number().positive(),
  notes: z.string().optional(),
  isPinned: z.boolean().default(false),
});

type CreatePlanDialogProps = {
  userId: string;
  triggerVariant?: "primary" | "outline";
  triggerText?: string;
};

export function CreatePlanDialog({
  userId,
  triggerVariant = "primary",
  triggerText = "Tạo kế hoạch",
}: CreatePlanDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("spending");
  const [isPending, startTransition] = useTransition();

  const spendingForm = useForm<z.infer<typeof spendingSchema>>({
    resolver: zodResolver(spendingSchema),
    defaultValues: {
      title: "",
      periodType: "MONTHLY",
      year: new Date().getFullYear(),
      targetAmount: 0,
      isPinned: false,
    },
  });

  const savingForm = useForm<z.infer<typeof savingSchema>>({
    resolver: zodResolver(savingSchema),
    defaultValues: {
      title: "",
      targetAmount: 0,
      currentAmount: 0,
      isPinned: false,
    },
  });

  const debtForm = useForm<z.infer<typeof debtSchema>>({
    resolver: zodResolver(debtSchema),
    defaultValues: {
      title: "",
      category: "BORROW",
      amount: 0,
      isPinned: false,
      notes: "",
    },
  });

  const triggerBtnVariant =
    triggerVariant === "outline" ? "outline" : "default";

  const titleByTab = useMemo(() => {
    if (tab === "spending") return "Kế hoạch chi tiêu";
    if (tab === "saving") return "Mục tiêu tiết kiệm";
    return "Vay / Nợ";
  }, [tab]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerBtnVariant}>{triggerText}</Button>
      </DialogTrigger>

      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Tạo kế hoạch</DialogTitle>
          <DialogDescription>{titleByTab}</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="spending">Chi tiêu</TabsTrigger>
            <TabsTrigger value="saving">Tiết kiệm</TabsTrigger>
            <TabsTrigger value="debt">Vay/Nợ</TabsTrigger>
          </TabsList>

          {/* TAB 1: CHI TIÊU */}
          <TabsContent value="spending" className="mt-4">
            <Form {...spendingForm}>
              <form
                className="space-y-4"
                onSubmit={spendingForm.handleSubmit((values) => {
                  startTransition(async () => {
                    try {
                      toast.loading("Đang tạo kế hoạch...", {
                        id: "create-plan",
                      });

                      await createPlannedSpending({
                        userId,
                        title: values.title,
                        periodType: values.periodType,
                        year: values.year,
                        quarter: values.quarter,
                        month: values.month,
                        weekOfYear: values.weekOfYear,
                        targetAmount: values.targetAmount,
                        categoryId: values.categoryId ?? null,
                        isPinned: values.isPinned,
                      });

                      toast.success("Đã tạo kế hoạch chi tiêu", {
                        id: "create-plan",
                      });
                      setOpen(false);
                      spendingForm.reset();
                      router.refresh();
                    } catch (e: any) {
                      toast.error(e?.message ?? "Tạo kế hoạch thất bại", {
                        id: "create-plan",
                      });
                    }
                  });
                })}
              >
                <FormField
                  control={spendingForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên kế hoạch</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Chi tiêu tháng 12" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={spendingForm.control}
                    name="periodType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Chu kỳ</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn chu kỳ" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="WEEKLY">Tuần</SelectItem>
                              <SelectItem value="MONTHLY">Tháng</SelectItem>
                              <SelectItem value="QUARTERLY">Quý</SelectItem>
                              <SelectItem value="YEARLY">Năm</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={spendingForm.control}
                    name="year"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Năm</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={2000}
                            max={2100}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* quarter / month / weekOfYear tương tự file cũ của m */}
                {spendingForm.watch("periodType") === "QUARTERLY" && (
                  <FormField
                    control={spendingForm.control}
                    name="quarter"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quý</FormLabel>
                        <FormControl>
                          <Select
                            value={field.value ? String(field.value) : ""}
                            onValueChange={(v) => field.onChange(Number(v))}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn quý" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">Quý 1</SelectItem>
                              <SelectItem value="2">Quý 2</SelectItem>
                              <SelectItem value="3">Quý 3</SelectItem>
                              <SelectItem value="4">Quý 4</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {spendingForm.watch("periodType") === "MONTHLY" && (
                  <FormField
                    control={spendingForm.control}
                    name="month"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tháng</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={12} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {spendingForm.watch("periodType") === "WEEKLY" && (
                  <FormField
                    control={spendingForm.control}
                    name="weekOfYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tuần trong năm</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={53} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={spendingForm.control}
                  name="targetAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngân sách</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1000} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={spendingForm.control}
                  name="isPinned"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0 pt-1">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onChange={(e) =>
                            field.onChange(e.currentTarget.checked)
                          }
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Ghim lên Dashboard
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Đang tạo..." : "Tạo kế hoạch"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* TAB 2: TIẾT KIỆM */}
          <TabsContent value="saving" className="mt-4">
            <Form {...savingForm}>
              <form
                className="space-y-4"
                onSubmit={savingForm.handleSubmit((values) => {
                  startTransition(async () => {
                    try {
                      toast.loading("Đang tạo mục tiêu...", {
                        id: "create-saving",
                      });

                      await createSavingGoal({
                        userId,
                        title: values.title,
                        targetAmount: values.targetAmount,
                        currentAmount: values.currentAmount ?? 0,
                        targetDate: values.targetDate
                          ? new Date(values.targetDate)
                          : null,
                        isPinned: values.isPinned,
                      });

                      toast.success("Đã tạo mục tiêu tiết kiệm", {
                        id: "create-saving",
                      });
                      setOpen(false);
                      savingForm.reset();
                      router.refresh();
                    } catch (e: any) {
                      toast.error(e?.message ?? "Tạo mục tiêu thất bại", {
                        id: "create-saving",
                      });
                    }
                  });
                })}
              >
                <FormField
                  control={savingForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên mục tiêu</FormLabel>
                      <FormControl>
                        <Input placeholder="VD: Mua nhà 2026" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={savingForm.control}
                    name="targetAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Số tiền mục tiêu</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step={1000} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={savingForm.control}
                    name="currentAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Đã có</FormLabel>
                        <FormControl>
                          <Input type="number" min={0} step={1000} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={savingForm.control}
                  name="targetDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ngày dự kiến đạt (tuỳ chọn)</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={savingForm.control}
                  name="isPinned"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0 pt-1">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onChange={(e) =>
                            field.onChange(e.currentTarget.checked)
                          }
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Ghim lên Dashboard
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Đang tạo..." : "Tạo mục tiêu"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>

          {/* TAB 3: VAY / NỢ */}
          <TabsContent value="debt" className="mt-4">
            <Form {...debtForm}>
              <form
                className="space-y-4"
                onSubmit={debtForm.handleSubmit((values) => {
                  startTransition(async () => {
                    try {
                      toast.loading("Đang tạo khoản vay/nợ...", {
                        id: "create-debt",
                      });

                      await createDebtPlan({
                        userId,
                        title: values.title,
                        category: values.category,
                        amount: values.amount,
                        notes: values.notes?.trim()
                          ? values.notes.trim()
                          : null,
                        isPinned: values.isPinned,
                      });

                      toast.success("Đã tạo khoản vay/nợ", {
                        id: "create-debt",
                      });
                      setOpen(false);
                      debtForm.reset();
                      router.refresh();
                    } catch (e: any) {
                      toast.error(e?.message ?? "Tạo khoản vay/nợ thất bại", {
                        id: "create-debt",
                      });
                    }
                  });
                })}
              >
                <FormField
                  control={debtForm.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tên khoản</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="VD: Vay bạn A / Cho bạn B vay"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={debtForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Loại</FormLabel>
                      <FormControl>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn loại" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="COLLECT">Thu nợ</SelectItem>
                            <SelectItem value="BORROW">Đi vay</SelectItem>
                            <SelectItem value="LEND">Cho vay</SelectItem>
                            <SelectItem value="REPAY">Trả nợ</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={debtForm.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Số tiền</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1000} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={debtForm.control}
                  name="isPinned"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center gap-2 space-y-0 pt-1">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onChange={(e) =>
                            field.onChange(e.currentTarget.checked)
                          }
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal">
                        Ghim lên Dashboard
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Hủy
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending ? "Đang tạo..." : "Tạo khoản"}
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
