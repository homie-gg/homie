'use client'

import CalendarIcon from '@/app/(user)/dashboard/_components/CalendarIcon'
import Select, { Option } from '@/lib/ui/HomieSelect'
import { useState } from 'react'
import styles from './DateSelect.module.scss'

export const timeOptions: Option[] = [
  {
    label: 'Past 7 days',
    value: '7',
  },
  {
    label: 'Past 4 weeks',
    value: '28',
  },
  {
    label: 'Past 3 months',
    value: '90',
  },
]

export default function DateSelect() {
  const [time, setTime] = useState<Option | null>(timeOptions[0])
  return (
    <Select
      instanceId="1"
      value={time}
      options={timeOptions}
      icon={<CalendarIcon />}
      showIndicator={false}
      className={styles.root}
      controlClassName={styles['select-control']}
      onChange={(value: any) => setTime(value)}
    />
  )
}
