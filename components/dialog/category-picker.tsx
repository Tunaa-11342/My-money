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
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, ChevronsUpDown, PlusSquare } from 'lucide-react'
import React, { useMemo, useState } from 'react'
import CreateCategoryDialog from './create-category'
import { getCategoriesByType } from '@/lib/actions/categories'

interface Props {
  userId: string
  type?: TransactionType  
  onChange: (value: string) => void
}

export default function CategoryPicker({ userId, type, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<string>('')

  const queryClient = useQueryClient()

  // ✅ Lấy danh mục từ DB (đã bao gồm mặc định seed)
  const { data: userCategories = [] } = useQuery({
    queryKey: ['categories', userId, type],
    queryFn: () => getCategoriesByType(userId, type || 'expense'),
  })

  // ✅ Chuẩn hóa dữ liệu để hiển thị
  const mergedCategories = useMemo(() => {
    return userCategories.map((c: any) => ({
      id: c.id,
      name: c.name,
      icon: c.icon || '📁',
      type: c.type,
    }))
  }, [userCategories])

  const handleSelect = (value: string) => {
    setSelected(value)
    onChange(value)
    setOpen(false)
  }

  const selectedCategory = mergedCategories.find((c) => c.id === selected)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-[240px] justify-between"
        >
          {selectedCategory ? (
            <>
              <span className="mr-1">{selectedCategory.icon}</span>
              {selectedCategory.name}
            </>
          ) : (
            'Chọn danh mục'
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-[260px] p-0">
        <Command>
          <CommandInput placeholder="Tìm danh mục..." />
          <CommandList>
            <CommandEmpty>Không tìm thấy danh mục</CommandEmpty>

            <CommandGroup heading="Danh mục có sẵn">
              {mergedCategories.map((cat) => (
                <CommandItem
                  key={cat.id}
                  value={cat.id}
                  onSelect={() => handleSelect(cat.id)}
                >
                  <span className="mr-2">{cat.icon}</span>
                  {cat.name}
                  <Check
                    className={cn(
                      'ml-auto h-4 w-4',
                      selected === cat.id ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>

        <div className="border-t px-3 py-2">
          <CreateCategoryDialog
            type={type || 'expense'}
            userId={userId}
            successCallback={() => {
              queryClient.invalidateQueries({ queryKey: ['categories', userId, type] })
            }}
            trigger={
              <Button
                variant="ghost"
                className="flex w-full justify-start text-muted-foreground hover:bg-accent"
              >
                <PlusSquare className="mr-2 h-4 w-4" />
                Tạo danh mục mới
              </Button>
            }
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
