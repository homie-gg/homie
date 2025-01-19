'use client'

import CalendarIcon from '@/app/(user)/pull_requests/_components/CalendarIcon'
import Select from '@/lib/ui/HomieSelect'
import { Days, daysLabels } from './dates'
import styles from './DateSelect.module.scss'

interface DateSelectProps {
  days: Days
  onChange: (days: string) => void
}

export default function DateSelect(props: DateSelectProps) {
  const { days, onChange } = props

  return (
    <Select
      instanceId="1"
      value={{
        value: days,
        label: daysLabels[days],
      }}
      options={Object.entries(daysLabels).map(([days, label]) => ({
        value: days,
        label,
      }))}
      icon={<CalendarIcon />}
      showIndicator={false}
      className={styles.root}
      controlClassName={styles['select-control']}
      onChange={({ value }: any) => onChange(value)}
    />
  )
}
