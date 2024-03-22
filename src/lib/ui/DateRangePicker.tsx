'use client'

import * as React from 'react'
import { CalendarIcon } from '@radix-ui/react-icons'
import { format } from 'date-fns'

import { cn } from '@/lib/utils'
import { Button } from '@/lib/ui/Button'
import { Calendar } from '@/lib/ui/Calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/lib/ui/Popover'
import { DateRange } from 'react-day-picker'

interface DateRangePickerProps {
  className?: string
  value: DateRange
  onChange: (date: DateRange | undefined) => void
  onOpenChange?: (open: boolean) => void
}

export function DateRangePicker(props: DateRangePickerProps) {
  const { className, value, onChange, onOpenChange } = props

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[260px] justify-start text-left font-normal',
              !value && 'text-muted-foreground',
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? (
              value.to ? (
                <>
                  {format(value.from, 'LLL dd, y')} -{' '}
                  {format(value.to, 'LLL dd, y')}
                </>
              ) : (
                format(value.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end">
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={value?.from}
            selected={value}
            onSelect={onChange}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  )
}
