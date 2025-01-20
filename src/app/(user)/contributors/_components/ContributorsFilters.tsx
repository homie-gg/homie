import React from 'react'
import ContributorsStatusSelect from '@/app/(user)/contributors/_components/ContributorsStatusSelect'
import DateSelect from '@/lib/ui/DateSelect'
import { Days } from '@/lib/ui/DateSelect/dates'
import styles from './ContributorsFilters.module.scss'
import { useRouter } from 'next/navigation'

type ContributorsFiltersProps = {
  days?: Days
}

export default function ContributorsFilters({
  days = '7',
}: ContributorsFiltersProps) {
  const router = useRouter()

  return (
    <div className={styles.container}>
      <ContributorsStatusSelect />
      <DateSelect
        onChange={(days) => router.push(`/contributors?days=${days}`)}
        days={days}
      />
    </div>
  )
}
