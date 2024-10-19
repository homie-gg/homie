'use client'

import * as React from 'react'
import { DayPicker } from 'react-day-picker'
import { ChevronLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/lib/ui/HomieButton'

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        months: 'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
        month: 'space-y-4',
        caption: 'flex justify-center pt-1 relative items-center',
        caption_label: 'font-sans-inter font-semibold text-base text-primary',
        nav: 'space-x-1 flex items-center',
        nav_button: cn(
          buttonVariants({ variant: 'outline' }),
          'h-7 w-7 bg-transparent p-0',
        ),
        nav_button_previous:
          'absolute left-1 text-primary border-0 shadow-none',
        nav_button_next: 'absolute right-1 text-primary border-0 shadow-none',
        table: 'w-full border-collapse space-y-1',
        head_row: 'flex',
        head_cell: 'text-primary rounded-md w-9 font-normal text-[0.8rem]',
        row: 'flex w-full mt-2',
        cell: 'h-9 w-9 text-center text-sm text-primary p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20',
        day: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
        ),
        day_range_end: 'day-range-end',
        day_selected:
          'bg-primary text-background hover:bg-primary hover:text-background focus:bg-primary focus:text-background',
        day_today: '',
        day_outside:
          'day-outside text-primary opacity-50 aria-selected:bg-accent/50 aria-selected:text-primary aria-selected:opacity-30',
        day_disabled: 'text-primary opacity-50',
        day_range_middle:
          'aria-selected:bg-primary/50 text-background aria-selected:text-background',
        day_hidden: 'invisible',
        ...classNames,
      }}
      components={{
        IconLeft: () => <ChevronLeft className="h-4 w-4  text-primary" />,
        IconRight: () => (
          <ChevronLeft className="h-4 w-4 rotate-180 text-primary" />
        ),
      }}
      {...props}
    />
  )
}
Calendar.displayName = 'Calendar'

export { Calendar }
