import React from 'react'

import ContributorDataCard, { ContributorData } from './ContributorDataCard'
import styles from './ContributorsData.module.scss'

const activityData = [
  {
    day: 'Day 1',
    current: 3,
    previous: 1,
  },
  {
    day: 'Day 2',
    current: 5,
    previous: 3,
  },
  {
    day: 'Day 3',
    current: 11,
    previous: 5,
  },
  {
    day: 'Day 4',
    current: 14,
    previous: 7,
  },
  {
    day: 'Day 5',
    current: 16,
    previous: 11,
  },
  {
    day: 'Day 6',
    current: 19,
    previous: 14,
  },
]

type ContributorsDataProps = {
  contributorsData: ContributorData[]
}

export default function ContributorsData({
  contributorsData,
}: ContributorsDataProps) {
  return (
    <div className={styles.main}>
      <div className={styles.content}>
        {contributorsData.map((item, index) => (
          <ContributorDataCard
            key={index}
            contributorData={item}
            activityData={activityData}
          />
        ))}
      </div>
    </div>
  )
}
