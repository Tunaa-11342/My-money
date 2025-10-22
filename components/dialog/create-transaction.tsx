'use client'

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { DateToUTCDate, cn } from '@/lib/utils'
import { ReactNode, useCallback, useState } from 'react'
import { vi } from 'date-fns/locale'
import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Button } from '@/components/ui/button'
import { format } from 'date-fns'
import { CalendarIcon, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Calendar } from '@/components/ui/calendar'
import { toast } from 'sonner'
import { TransactionType } from '@/types'
import { CreateTransactionSchema, CreateTransactionSchemaType } from '@/lib/schemas/transactions'
import CategoryPicker from './category-picker'
import { createTransaction } from '@/lib/actions/transactions'

interface Props {
  trigger: ReactNode
  type: TransactionType
  userId: string
}

function CreateTransactionDialog({ trigger, type, userId }: Props) {
  const form = useForm<CreateTransactionSchemaType>({
    resolver: zodResolver(CreateTransactionSchema),
    defaultValues: {
      type,
      date: new Date(),
    },
  })
  const [open, setOpen] = useState(false)
  const handleCategoryChange = useCallback(
    (value: string) => {
      form.setValue('category', value)
    },
    [form]
  )

  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: (values: CreateTransactionSchemaType) => createTransaction(userId, values),
    onSuccess: () => {
      toast.success('Giao dịch được tạo thành công 🎉', {
        id: 'create-transaction',
      })

      form.reset({
        type,
        description: '',
        amount: 0,
        date: new Date(),
        category: undefined,
      })

      queryClient.invalidateQueries({
        queryKey: ['overview'],
      })

      setOpen((prev) => !prev)
    },
  })

  const onSubmit = useCallback(
    (values: CreateTransactionSchemaType) => {
      toast.loading('Creating transaction...', { id: 'create-transaction' })

      mutate({
        ...values,
        date: DateToUTCDate(values.date),
      })
    },
    [mutate]
  )

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
              Tạo một giao dịch{' '}
                  <span className={cn('m-1', type === 'income' ? 'text-emerald-500' : 'text-red-500')}>
                        {type === 'income' ? 'thu nhập' : 'chi tiêu'}
                  </span>
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form className='space-y-4' onSubmit={form.handleSubmit(onSubmit)}>
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Mô tả</FormLabel>
                  <FormControl>
                    <Input defaultValue={''} {...field} />
                  </FormControl>
                  <FormDescription>Mô tả giao dịch (không bắt buộc)</FormDescription>
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='amount'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Số tiền</FormLabel>
                  <FormControl>
                    <Input defaultValue={0} type='number' {...field} />
                  </FormControl>
                  <FormDescription>Số tiền giao dịch (yêu cầu)</FormDescription>
                </FormItem>
              )}
            />

            <div className='flex items-center justify-between gap-2'>
              <FormField
                control={form.control}
                name='category'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>Danh mục</FormLabel>
                    <FormControl>
                      <CategoryPicker userId={userId} type={type} onChange={handleCategoryChange} />
                    </FormControl>
                    <FormDescription>Chọn một danh mục cho giao dịch này</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='date'
                render={({ field }) => (
                  <FormItem className='flex flex-col'>
                    <FormLabel>Ngày giao dịch</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-[200px] pl-3 text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                                {field.value ? format(field.value, 'PPP', { locale: vi }) : <span>Chọn một ngày</span>}
                            <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className='w-auto p-0'>
                        <Calendar
                          mode='single'
                          selected={field.value}
                          onSelect={(value) => {
                            if (!value) return
                            field.onChange(value)
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
              type='button'
              variant={'secondary'}
              onClick={() => {
                form.reset()
              }}
            >
              Hủy bỏ
            </Button>
          </DialogClose>
          <Button onClick={form.handleSubmit(onSubmit)} disabled={isPending}>
            {!isPending && 'Tạo mới'}
            {isPending && <Loader2 className='animate-spin' />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default CreateTransactionDialog
