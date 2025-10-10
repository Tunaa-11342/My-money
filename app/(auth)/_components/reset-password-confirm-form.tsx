'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { useSignIn } from '@clerk/nextjs'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import type { z } from 'zod'

import { showErrorToast } from '@/lib/handle-error'
import { resetPasswordSchema } from '@/lib/validations/auth'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { Icons } from '@/components/app-ui/icons'
import { PasswordInput } from '@/components/app-ui/password-input'

type Inputs = z.infer<typeof resetPasswordSchema>

export function ResetPasswordConfirmForm() {
  const router = useRouter()
  const { isLoaded, signIn, setActive } = useSignIn()
  const [loading, setLoading] = React.useState(false)

  // react-hook-form
  const form = useForm<Inputs>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
      code: '',
    },
  })

  async function onSubmit(data: Inputs) {
    if (!isLoaded) return

    setLoading(true)

    try {
      const attemptFirstFactor = await signIn.attemptFirstFactor({
        strategy: 'reset_password_email_code',
        code: data.code,
        password: data.password,
      })

      if (attemptFirstFactor.status === 'needs_second_factor') {
        // TODO: implement 2FA (requires clerk pro plan)
      } else if (attemptFirstFactor.status === 'complete') {
        await setActive({
          session: attemptFirstFactor.createdSessionId,
        })
        router.push(`${window.location.origin}/`)
        toast.success('Password reset successfully.')
      } else {
        console.error(attemptFirstFactor)
      }
    } catch (err) {
      showErrorToast(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form className='grid gap-4' onSubmit={form.handleSubmit(onSubmit)}>
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <PasswordInput placeholder='*********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Xác nhận mật khẩu</FormLabel>
              <FormControl>
                <PasswordInput placeholder='*********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='code'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mật khẩu một lần</FormLabel>
              <FormControl>
                <InputOTP maxLength={6} {...field}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </FormControl>
              <FormDescription>Vui lòng nhập mã 6 chữ số được gửi đến email của bạn.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='mt-2 flex flex-col-reverse gap-2 sm:flex-row'>
          <Button type='button' variant='outline' className='w-full' onClick={() => router.back()}>
            Quay lại
          </Button>
          <Button className='w-full' disabled={loading}>
            {loading && <Icons.spinner className='mr-2 size-4 animate-spin' aria-hidden='true' />}
            Đặt lại mật khẩu
            <span className='sr-only'>Đặt lại mật khẩu</span>
          </Button>
        </div>
      </form>
    </Form>
  )
}
