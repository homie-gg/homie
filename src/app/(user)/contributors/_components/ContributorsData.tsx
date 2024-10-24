import React from 'react'

import ContributorDataCard from './ContributorDataCard'
import { ContributorCategory } from './ContributorCategorySelectItem'
import styles from './ContributorsData.module.scss'

type ContributorDataProps = {}

const contributorsData = [
  {
    name: 'Andre Flores',
    username: 'andreflores',
    category: 'low_on_tasks' as ContributorCategory,
    active: true,
    time: {
      current: '3:31 PM',
      timezone: 'PST',
      country: '',
    },
    hoursSinceLastPr: 2,
    tasksAssignedCount: 2,
  },
  {
    name: 'Olivia Rhye',
    username: 'oliviarhye',
    category: 'no_tasks' as ContributorCategory,
    active: true,
    time: {
      current: '4:56 PM',
      timezone: 'EST',
      country: '',
    },
    hoursSinceLastPr: 3,
    tasksAssignedCount: 4,
  },
]

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

export default function ContributorsData({}: ContributorDataProps) {
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
