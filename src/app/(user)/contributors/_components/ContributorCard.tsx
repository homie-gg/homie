import React from 'react'
import Image from 'next/image'
import clsx from 'clsx'
import styles from './ContributorCard.module.scss'
import { GetContributorsData } from '@/app/(user)/contributors/_utils/get-contributors'
import CurrentTime from '@/lib/ui/CurrentTime'
import ContributorActivityChart from '@/app/(user)/contributors/_components/ContributorActivity'

type ContributorCardProps = {
  contributor: GetContributorsData[number]
}

const taskStatus = {
  low_on_tasks: 'Low on tasks',
  no_tasks: 'No task assigned',
}

export default async function ContributorCard(props: ContributorCardProps) {
  const { contributor } = props
  const { openTaskCount } = contributor

  const taskStatusBadge: null | keyof typeof taskStatus =
    openTaskCount === 0 ? 'no_tasks' : openTaskCount < 3 ? 'low_on_tasks' : null

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.profile}>
          <div className={styles['profile-img']}>
            {contributor.image && (
              <Image
                fill
                src={contributor.image}
                alt={contributor.userName}
                sizes="750px"
              />
            )}
            <span
              data-active={contributor.isActive}
              className={styles['profile-tag']}
            />
          </div>
          <div className={styles['profile-details']}>
            <p>{contributor.realName ?? contributor.userName}</p>
            <p>{contributor.realName ? contributor.userName : '-'}</p>
          </div>
        </div>
        {taskStatusBadge && (
          <div
            className={clsx(styles.badge, {
              [styles['badge--warning']]: taskStatusBadge === 'low_on_tasks',
              [styles['badge--error']]: taskStatusBadge === 'no_tasks',
            })}
          >
            {taskStatus[taskStatusBadge]}
          </div>
        )}
      </div>
      <div className={styles.body}>
        <ul className={styles['data-list']}>
          <li className={styles['data-item']}>
            <p>Current time</p>
            <p>
              <CurrentTime timezone={contributor.timezone} />
            </p>
          </li>
          <li className={styles['data-item']}>
            <p>Hours since last PR</p>
            <p>{contributor.hoursSinceLastPr} hours ago</p>
          </li>
          <li className={styles['data-item']}>
            <p>Tasks Assigned</p>
            <p>{contributor.openTaskCount} tasks</p>
          </li>
        </ul>
        <ContributorActivityChart contributor={contributor} />
      </div>
    </div>
  )
}
