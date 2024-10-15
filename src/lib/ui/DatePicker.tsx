'use client'

import * as React from 'react'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import styles from './DatePicker.module.scss'
import { Button } from '@/lib/ui/HomieButton'
import { CalendarIcon } from 'lucide-react'
import { Calendar } from '@/lib/ui/Calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/lib/ui/Popover'

export type DateOption =
  | 'today'
  | 'yesterday'
  | 'this-week'
  | 'last-week'
  | 'this-month'
  | 'last-month'
  | 'this-year'
  | 'last-year'
  | 'all-time'

export const getDateRange = (value: DateOption) => {
  const today = new Date()
  const from = new Date()
  const to = new Date()

  switch (value) {
    case 'today':
      from.setHours(0, 0, 0, 0)
      to.setHours(23, 59, 59, 999)
      break
    case 'yesterday':
      from.setDate(today.getDate() - 1)
      to.setDate(today.getDate() - 1)
      break
    case 'this-week':
      from.setDate(today.getDate() - today.getDay())
      break
    case 'last-week':
      from.setDate(today.getDate() - today.getDay() - 7)
      to.setDate(today.getDate() - today.getDay() - 1)
      break
    case 'this-month':
      from.setDate(1)
      break
    case 'last-month':
      from.setMonth(today.getMonth() - 1)
      from.setDate(1)
      to.setDate(0)
      break
    case 'this-year':
      from.setMonth(0)
      from.setDate(1)
      break
    case 'last-year':
      from.setFullYear(today.getFullYear() - 1)
      from.setMonth(0)
      from.setDate(1)
      to.setFullYear(today.getFullYear() - 1)
      to.setMonth(11)
      to.setDate(31)
      break
    case 'all-time':
      from.setFullYear(0)
      break
  }

  return { from, to }
}

export const dateOptions: { value: DateOption; label: string }[] = [
  {
    label: 'Today',
    value: 'today',
  },
  {
    label: 'Yesterday',
    value: 'yesterday',
  },
  {
    label: 'This week',
    value: 'this-week',
  },
  {
    label: 'Last week',
    value: 'last-week',
  },
  {
    label: 'This month',
    value: 'this-month',
  },
  {
    label: 'Last month',
    value: 'last-month',
  },
  {
    label: 'This year',
    value: 'this-year',
  },
  {
    label: 'Last year',
    value: 'last-year',
  },
  {
    label: 'All time',
    value: 'all-time',
  },
]

type Props = {
  date?: DateRange
  setDate: (date?: DateRange) => void
  className?: string
}

const DatePicker: React.FC<Props> = ({ date, setDate, className = '' }) => {
  const [tempDate, setTempDate] = React.useState<DateRange | undefined>(date)
  const triggerRef = React.useRef<HTMLButtonElement>(null)

  const handleCalendarOption = (value: DateOption) => {
    const dateRange = getDateRange(value)
    setTempDate(dateRange)
  }

  const revertSelection = () => {
    setTempDate(date)
  }

  const close = () => {
    triggerRef.current?.click()
  }

  React.useEffect(() => {
    setTempDate(date)
  }, [date])

  return (
    <div className={cn(styles.datepicker, className)}>
      <Popover
        onOpenChange={(open) => {
          !open && revertSelection()
        }}
      >
        <PopoverTrigger asChild>
          <Button
            ref={triggerRef}
            size="lg"
            variant={'outline'}
            className={styles.trigger}
          >
            <CalendarIcon width={20} />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, 'LLL dd')} - {format(date.to, 'LLL dd')}
                </>
              ) : (
                format(date.from, 'LLL dd')
              )
            ) : (
              <span>Pick a date</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className={styles['popover-content']} align="end">
          <div className={styles['calendar-options']}>
            <ul>
              {dateOptions.map(({ value, label }, index) => (
                <li key={index}>
                  <Button
                    variant="ghost"
                    className={styles['calendar-option']}
                    onClick={() => handleCalendarOption(value)}
                  >
                    {label}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
          <div className={styles['calendar-main']}>
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={tempDate?.from}
              selected={tempDate}
              onSelect={setTempDate}
              numberOfMonths={2}
              className={styles.calendar}
            />
            <div className={styles['calendar-footer']}>
              <div className={styles['date-summary']}>
                {tempDate?.from && (
                  <span>{format(tempDate.from, 'LLL dd, y')}</span>
                )}
                {tempDate?.to && (
                  <>
                    - <span>{format(tempDate.to, 'LLL dd, y')}</span>
                  </>
                )}
              </div>
              <div className={styles['calendar-actions']}>
                <Button
                  variant="outline"
                  onClick={() => {
                    revertSelection()
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setDate(tempDate)
                    close()
                  }}
                >
                  Apply
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

export default DatePicker
