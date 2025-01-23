'use client'

import DateSelect from '@/lib/ui/DateSelect'
import { Days } from '@/lib/ui/DateSelect/dates'
import { useRouter } from 'next/navigation'

interface ContributorDateSelectProps {
  days: Days
  contributor: {
    id: number
  }
}

export default function ContributorDateSelect(
  props: ContributorDateSelectProps,
) {
  const { days, contributor } = props

  const router = useRouter()

  return (
    <DateSelect
      onChange={(days) =>
        router.push(`/contributor/${contributor.id}?days=${days}`)
      }
      days={days}
    />
  )
}
