'use client'

import { useRouter } from 'next/navigation'
import DateSelect from '@/lib/ui/DateSelect'
import { Days } from '@/lib/ui/DateSelect/dates'

interface PullRequestsDateSelectorProps {
  days: Days
}

export default function PullRequestsDateSelector(
  props: PullRequestsDateSelectorProps,
) {
  const { days } = props
  const router = useRouter()

  return (
    <DateSelect
      onChange={(days) => router.push(`/pull_requests?days=${days}`)}
      days={days}
    />
  )
}
