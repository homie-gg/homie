'use client'

import CalendarIcon from '@/app/(user)/pull_requests/_components/CalendarIcon'
import Select from '@/lib/ui/HomieSelect'
import styles from './DateSelect.module.scss'
import { useRouter } from 'next/navigation'
import { Days, daysLabels } from '@/app/(user)/_utils/dates'

interface DateSelectProps {
  slug: string
  days: Days
}

export default function DateSelect(props: DateSelectProps) {
  const { slug, days } = props
  const router = useRouter()

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
      onChange={({ value }: any) => {
        router.push(`/${slug}?days=${value}`)
      }}
    />
  )
}
