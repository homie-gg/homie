'use client'

import { getReviewUrl } from '@/app/(user)/review/_utils/set-review-url'
import { DateRangePicker } from '@/lib/ui/DateRangePicker'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'
import { DateRange } from 'react-day-picker'

interface DatePickerProps {
  from: Date
  to: Date
  tab: string
}

export default function DatePicker(props: DatePickerProps) {
  const { from, to, tab } = props

  const router = useRouter()

  const [date, setDate] = useState<DateRange>({
    from,
    to,
  })

  const setNonNullableDate = useCallback((date: DateRange | undefined) => {
    // Ignore null values
    if (!date) {
      return
    }

    setDate(date)
  }, [])

  const handleToggleOpen = (opened: boolean) => {
    if (opened) {
      return
    }

    if (!date.from || !date.to) {
      return
    }

    router.push(
      getReviewUrl({
        startDate: date.from,
        endDate: date.to,
        tab,
      }),
    )
  }

  return (
    <DateRangePicker
      value={date}
      onChange={setNonNullableDate}
      onOpenChange={handleToggleOpen}
    />
  )
}
