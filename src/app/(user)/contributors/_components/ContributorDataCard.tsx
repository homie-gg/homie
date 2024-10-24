import React from 'react'
import Image from 'next/image'
import clsx from 'clsx'
import styles from './ContributorDataCard.module.scss'
import { ContributorCategory } from './ContributorCategorySelectItem'
import { PeriodChartData } from '@/lib/ui/PeriodChart'
import ContributorActivityChart from './ContributorActivityChart'

type ContributorData = {
  name: string
  username: string
  image?: string
  category: ContributorCategory
  active: boolean
  time: {
    current: string
    timezone: string
    country?: string
  }
  hoursSinceLastPr: number
  tasksAssignedCount: number
}

type ContributorDataCardProps = {
  contributorData: ContributorData
  activityData: PeriodChartData
}

export default function ContributorDataCard({
  contributorData: {
    name,
    username,
    image,
    category,
    active,
    time: { current, timezone, country },
    hoursSinceLastPr,
    tasksAssignedCount,
  },
  activityData,
}: ContributorDataCardProps) {
  const badgeLabel =
    category === 'none'
      ? ''
      : category === 'low_on_tasks'
        ? 'Low on tasks'
        : 'No task assigned'

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.profile}>
          <div className={styles['profile-img']}>
            {image && <Image fill src={image} alt={name} sizes="750px" />}
            <span data-active={active} className={styles['profile-tag']} />
          </div>
          <div className={styles['profile-details']}>
            <p>{name}</p>
            <p>{username}</p>
          </div>
        </div>
        {badgeLabel && (
          <div
            className={clsx(styles.badge, {
              [styles['badge--warning']]: category === 'low_on_tasks',
              [styles['badge--error']]: category === 'no_tasks',
            })}
          >
            {badgeLabel}
          </div>
        )}
      </div>
      <div className={styles.body}>
        <ul className={styles['data-list']}>
          <li className={styles['data-item']}>
            <p>Current time</p>
            <p>
              <span>{current}</span> <span>{timezone}</span>{' '}
              {country && (
                <Image src={country} alt={timezone} width={24} height={24} />
              )}
            </p>
          </li>
          <li className={styles['data-item']}>
            <p>Hours since last PR</p>
            <p>{hoursSinceLastPr} hours ago</p>
          </li>
          <li className={styles['data-item']}>
            <p>Tasks Assigned</p>
            <p>{tasksAssignedCount} tasks</p>
          </li>
        </ul>
        <ContributorActivityChart data={activityData} />
      </div>
    </div>
  )
}
