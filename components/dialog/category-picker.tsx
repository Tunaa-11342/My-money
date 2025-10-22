'use client'

import { Button } from '@/components/ui/button'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { cn } from '@/lib/utils'
import { TransactionType } from '@/types'
import { Category } from '@prisma/client'
import { useQuery } from '@tanstack/react-query'
import { Check, ChevronsUpDown } from 'lucide-react'
import React, { useCallback, useEffect, useState } from 'react'
import CreateCategoryDialog from './create-category'
import { getCategoriesByType } from '@/lib/actions/categories'

interface Props {
  type: TransactionType
  onChange: (value: string) => void
  userId: string
}

function CategoryPicker({ type, onChange, userId }: Props) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState('')

  useEffect(() => {
    if (!value) return
    onChange(value)
  }, [onChange, value])

  const categoriesQuery = useQuery({
    queryKey: ['categories', type, userId],
    queryFn: () => getCategoriesByType(userId, type),
  })

  const selectedCategory = categoriesQuery.data?.find(
    (category: Category) => category.name === value
  )
  const { refetch } = categoriesQuery

  const successCallback = useCallback(
    (category: Category) => {
      setValue(category.name)
      refetch() 
      setOpen((prev) => !prev)
    },
    [setValue, setOpen, refetch]
  )

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={'outline'}
          role='combobox'
          aria-expanded={open}
          className='w-[200px] justify-between'
        >
          {selectedCategory ? <CategoryRow category={selectedCategory} /> : 'Chọn danh mục'}
          <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[200px] p-0'>
        <Command
          onSubmit={(e) => {
            e.preventDefault()
          }}
        >
          <CommandInput placeholder='Tìm kiếm danh mục...' />
          <CreateCategoryDialog userId={userId} type={type} successCallback={successCallback} />
          <CommandEmpty>
            <p>Không tìm thấy danh mục</p>
            <p className='text-xs text-muted-foreground'>Mẹo: Tạo một danh mục mới</p>
          </CommandEmpty>
          <CommandGroup>
            <CommandList>
              {categoriesQuery.data &&
                categoriesQuery.data.map((category: Category) => (
                  <CommandItem
                    key={category.name}
                    onSelect={() => {
                      setValue(category.name)
                      setOpen((prev) => !prev)
                    }}
                  >
                    <CategoryRow category={category} />
                    <Check
                      className={cn(
                        'mr-2 w-4 h-4 opacity-0',
                        value === category.name && 'opacity-100'
                      )}
                    />
                  </CommandItem>
                ))}
            </CommandList>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default CategoryPicker

function CategoryRow({ category }: { category: Category }) {
  return (
    <div className='flex items-center gap-2'>
      <span role='img'>{category.icon}</span>
      <span>{category.name}</span>
    </div>
  )
}
