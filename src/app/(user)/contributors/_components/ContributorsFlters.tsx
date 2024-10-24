import React from 'react'
import ContributorCategorySelect from './ContributorCategorySelect'
import DateSelect from '@/app/(user)/_components/DateSelect/DateSelect'
import { Days } from '@/app/(user)/_utils/dates'
import styles from './ContributorsFilters.module.scss'

type ContributorsFiltersProps = {
  days?: Days
}

const ContributorsFilters = ({ days = '7' }: ContributorsFiltersProps) => {
  return (
    <div className={styles.container}>
      <ContributorCategorySelect />
      <DateSelect slug="contributors" days={days} />
    </div>
  )
}

export default ContributorsFilters
