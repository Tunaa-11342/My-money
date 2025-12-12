// app/(lobby)/plans/_components/create-plan-dialog.tsx
"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarRange } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { createPlannedSpending } from "@/lib/actions/planned-spending";
import { PlannedPeriodType } from "@prisma/client";

const formSchema = z
  .object({
    title: z.string().min(1, "Nhập tên kế hoạch"),
    periodType: z.nativeEnum(PlannedPeriodType),
    year: z.coerce.number().int().min(2000).max(2100),
    quarter: z.coerce.number().int().min(1).max(4).optional(),
    month: z.coerce.number().int().min(1).max(12).optional(),
    weekOfYear: z.coerce.number().int().min(1).max(53).optional(),
    targetAmount: z.coerce.number().positive("Số tiền mục tiêu phải lớn hơn 0"),
    // TODO: sau này m có thể đổi thành select category
    categoryId: z.string().optional(),
    isPinned: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    if (data.periodType === "QUARTERLY" && !data.quarter) {
      ctx.addIssue({
        code: "custom",
        message: "Chọn quý",
        path: ["quarter"],
      });
    }
    if (data.periodType === "MONTHLY" && !data.month) {
      ctx.addIssue({
        code: "custom",
        message: "Chọn tháng",
        path: ["month"],
      });
    }
    if (data.periodType === "WEEKLY" && !data.weekOfYear) {
      ctx.addIssue({
        code: "custom",
        message: "Chọn tuần",
        path: ["weekOfYear"],
      });
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface CreatePlanDialogProps {
  userId: string;
  /**
   * Nếu muốn dùng dialog ở nhiều chỗ (header / empty state), cho phép truyền custom label
   */
  triggerVariant?: "primary" | "outline";
  triggerText?: string;
}

export function CreatePlanDialog({
  userId,
  triggerVariant = "primary",
  triggerText = "Tạo kế hoạch",
}: CreatePlanDialogProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      periodType: "MONTHLY",
      year: new Date().getFullYear(),
      quarter: 1,
      month: new Date().getMonth() + 1,
      weekOfYear: 1,
      targetAmount: 0,
      categoryId: undefined,
      isPinned: false,
    },
  });

  const periodType = form.watch("periodType");

  function onSubmit(values: FormValues) {
    startTransition(async () => {
      try {
        await createPlannedSpending({
          userId,
          title: values.title,
          periodType: values.periodType,
          year: values.year,
          quarter:
            values.periodType === "QUARTERLY" ? values.quarter : undefined,
          month: values.periodType === "MONTHLY" ? values.month : undefined,
          weekOfYear:
            values.periodType === "WEEKLY" ? values.weekOfYear : undefined,
          targetAmount: values.targetAmount,
          categoryId: values.categoryId || null,
          isPinned: values.isPinned,
        });

        toast.success("Tạo kế hoạch thành công");

        form.reset({
          title: "",
          periodType: values.periodType,
          year: values.year,
          quarter: values.quarter,
          month: values.month,
          weekOfYear: values.weekOfYear,
          targetAmount: 0,
          categoryId: undefined,
          isPinned: false,
        });

        setOpen(false);
        router.refresh();
      } catch (error) {
        console.error(error);
        toast.error("Không tạo được kế hoạch, vui lòng thử lại.");
      }
    });
  }

  const triggerButton =
    triggerVariant === "primary" ? (
      <Button className="gap-2">
        <CalendarRange className="h-4 w-4" />
        {triggerText}
      </Button>
    ) : (
      <Button variant="outline" className="gap-2">
        <CalendarRange className="h-4 w-4" />
        {triggerText}
      </Button>
    );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Tạo kế hoạch chi tiêu</DialogTitle>
          <DialogDescription>
            Đặt tên, chọn chu kỳ và số tiền mục tiêu cho kế hoạch chi tiêu của
            bạn.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Tên kế hoạch */}
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên kế hoạch</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ví dụ: Kế hoạch chi tiêu Tháng 12/2025"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Chu kỳ & năm */}
            <div className="grid grid-cols-2 gap-3">
              <FormField
                control={form.control}
                name="periodType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Chu kỳ</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value}
                        onValueChange={(value) =>
                          field.onChange(value as PlannedPeriodType)
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="YEARLY">Theo năm</SelectItem>
                          <SelectItem value="QUARTERLY">Theo quý</SelectItem>
                          <SelectItem value="MONTHLY">Theo tháng</SelectItem>
                          <SelectItem value="WEEKLY">Theo tuần</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="year"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Năm</FormLabel>
                    <FormControl>
                      <Input type="number" min={2000} max={2100} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Quý / Tháng / Tuần tùy theo periodType */}
            {periodType === "QUARTERLY" && (
              <FormField
                control={form.control}
                name="quarter"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quý</FormLabel>
                    <FormControl>
                      <Select
                        value={field.value?.toString()}
                        onValueChange={(value) => field.onChange(Number(value))}
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

            {periodType === "MONTHLY" && (
              <FormField
                control={form.control}
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

            {periodType === "WEEKLY" && (
              <FormField
                control={form.control}
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

            {/* Số tiền mục tiêu */}
            <FormField
              control={form.control}
              name="targetAmount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tiền mục tiêu</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      step={1000}
                      placeholder="Ví dụ: 10000000"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Ghim lên dashboard */}
            <FormField
              control={form.control}
              name="isPinned"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2 space-y-0 pt-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onChange={(event) => field.onChange(event.target.checked)}
                    />
                  </FormControl>
                  <FormLabel className="text-sm font-normal">
                    Ghim kế hoạch này lên Dashboard
                  </FormLabel>
                </FormItem>
              )}
            />

            <DialogFooter className="pt-2">
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
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
