import React from 'react'
import ContributorCategorySelect from './ContributorCategorySelect'
import DateSelect from '@/lib/ui/DateSelect'
import { Days } from '@/lib/ui/DateSelect/dates'
import styles from './ContributorsFilters.module.scss'

type ContributorsFiltersProps = {
  days?: Days
}

export default function ContributorsFilters({
  days = '7',
}: ContributorsFiltersProps) {
  return (
    <div className={styles.container}>
      <ContributorCategorySelect />
      <DateSelect slug="contributors" days={days} />
    </div>
  )
}
