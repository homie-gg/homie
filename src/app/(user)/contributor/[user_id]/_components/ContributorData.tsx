'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import ContributorDataCard from './ContributorDataCard'
import { getCurrentTime } from '@/lib/utils'
import styles from './ContributorData.module.scss'

type ContributorDataProps = {
  locale: {
    tz?: string
    country?: string
  }
  hoursSinceLastPr: number | null
  tasksAssigned: number
  tasksCompleted: number
}

export default function ContributorData(props: ContributorDataProps) {
  const {
    locale: { country: countryImage, tz = 'PST' },
    hoursSinceLastPr,
    tasksAssigned,
    tasksCompleted,
  } = props

  const [time, setTime] = useState<string>(getCurrentTime(tz))

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getCurrentTime(tz))
    }, 30000)

    return () => clearInterval(interval)
  }, [tz])

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <div className={styles['data-list']}>
          <ContributorDataCard
            label="Current time"
            data={
              <>
                <span>{time}</span>
                {countryImage && (
                  <span className={styles['country-img']}>
                    <Image src={countryImage} alt={tz} width={24} height={24} />
                  </span>
                )}
              </>
            }
          />
          <ContributorDataCard
            label="Hours since last PR"
            data={hoursSinceLastPr}
          />
          <ContributorDataCard label="Tasks Assigned" data={tasksAssigned} />
          <ContributorDataCard label="Tasks Completed" data={tasksCompleted} />
        </div>
      </div>
    </div>
  )
}
