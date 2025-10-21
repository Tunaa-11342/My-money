'use client'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { deleteCategory } from '@/lib/actions/categories'
import { DeleteCategorySchemaType } from '@/lib/schemas/categories'
import { TransactionType } from '@/types'
import { Category } from '@prisma/client'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import React, { ReactNode } from 'react'
import { toast } from 'sonner'

interface Props {
  trigger: ReactNode
  category: Category
  userId: string
}

function DeleteCategoryDialog({ category, trigger, userId }: Props) {
  const categoryIdentifier = `${category.name}-${category.type}`
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (values: DeleteCategorySchemaType) => deleteCategory(userId, values),
    onSuccess: async () => {
      toast.success('Category deleted successfully', {
        id: categoryIdentifier,
      })

      await queryClient.invalidateQueries({
        queryKey: ['categories'],
      })
    },
    onError: () => {
      toast.error('Something went wrong', {
        id: categoryIdentifier,
      })
    },
  })
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{trigger}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Bạn có chắc chắn không?</AlertDialogTitle>
          <AlertDialogDescription>
            Không thể hoàn tác hành động này. Thao tác này sẽ xóa vĩnh viễn danh mục của bạn.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Hủy bỏ</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              toast.loading('Deleting category...', {
                id: categoryIdentifier,
              })
              deleteMutation.mutate({
                name: category.name,
                type: category.type as TransactionType,
              })
            }}
          >
            Tiếp tục
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default DeleteCategoryDialog
