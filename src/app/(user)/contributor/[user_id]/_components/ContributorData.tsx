'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import ContributorDataCard from './ContributorDataCard'
import { getCurrentTime } from '@/app/(user)/contributor/_utils/get-current-time'
import styles from './ContributorData.module.scss'

type ContributorDataProps = {
  country: {
    name: string
    image?: string
  }
  hoursSinceLastPr: number
  tasksAssigned: number
  tasksCompleted: number
}

export default function ContributorData({
  country: { name: countryName, image: countryImage },
  hoursSinceLastPr,
  tasksAssigned,
  tasksCompleted,
}: ContributorDataProps) {
  const [time, setTime] = useState<string>(getCurrentTime())

  useEffect(() => {
    setInterval(() => {
      setTime(getCurrentTime())
    }, 30000)
  }, [])

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
                    <Image
                      src={countryImage}
                      alt={countryName}
                      width={24}
                      height={24}
                    />
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
