'use client'

import ContributorMetricsCard from '@/app/(user)/contributors/[contributor_id]/_components/ContributorMetricsCard'
import styles from './ContributorMetrics.module.scss'
import CurrentTime from '@/lib/ui/CurrentTime'

type ContributorDataProps = {
  timezone?: string
  hoursSinceLastPr: number | null
  tasksAssigned: number
  tasksCompleted: number
}

export default function ContributorMetrics(props: ContributorDataProps) {
  const { hoursSinceLastPr, tasksAssigned, tasksCompleted, timezone } = props

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <div className={styles['data-list']}>
          <ContributorMetricsCard label="Current time">
            <CurrentTime timezone={timezone} />
          </ContributorMetricsCard>
          <ContributorMetricsCard label="Hours since last PR">
            {hoursSinceLastPr}
          </ContributorMetricsCard>
          <ContributorMetricsCard label="Tasks Assigned">
            {tasksAssigned}
          </ContributorMetricsCard>
          <ContributorMetricsCard label="Tasks Completed">
            {tasksCompleted}
          </ContributorMetricsCard>
        </div>
      </div>
    </div>
  )
}
