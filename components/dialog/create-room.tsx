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
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

const CreateRoomSchema = z.object({
  name: z.string().min(1, "Vui lòng nhập tên phòng"),
  maxMembers: z
    .number()
    .min(1, "Ít nhất 1 thành viên")
    .max(20, "Tối đa 20 thành viên"),
  isPrivate: z.boolean().default(false),
});

export type CreateRoomSchemaType = z.infer<typeof CreateRoomSchema>;

async function createRoom(values: CreateRoomSchemaType) {
  const res = await fetch("/api/groups", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(values),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || "Failed to create room");
  }

  return res.json();
}

interface Props {
  trigger: React.ReactNode;
}

export default function CreateRoomDialog({ trigger }: Props) {
  const form = useForm<CreateRoomSchemaType>({
    resolver: zodResolver(CreateRoomSchema),
    defaultValues: {
      name: "",
      maxMembers: 4,
      isPrivate: false,
    },
  });

  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: createRoom,
    onSuccess: () => {
      toast.dismiss("create-room");
      toast.success("Tạo phòng thành công 🎉");
      form.reset();
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ["rooms"] });
    },
    onError: () => {
      toast.error("Lỗi khi tạo phòng 😢");
    },
  });

  const onSubmit = useCallback(
    (values: CreateRoomSchemaType) => {
      toast.loading("Đang tạo phòng...", { id: "create-room" });
      mutate(values);
    },
    [mutate]
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tạo phòng</DialogTitle>
          <p className="text-sm text-neutral-500">
            Điền các thông tin bên dưới để tạo phòng mới
          </p>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tên phòng</FormLabel>
                  <FormControl>
                    <Input placeholder="VD: Phòng 401" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxMembers"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số lượng thành viên tối đa</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      max={20}
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isPrivate"
              render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-lg border p-3">
                  <FormLabel>Chế độ riêng tư</FormLabel>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Hủy bỏ
                </Button>
              </DialogClose>
              <Button type="submit" disabled={isPending}>
                {!isPending ? (
                  "Tạo phòng"
                ) : (
                  <Loader2 className="animate-spin" />
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
