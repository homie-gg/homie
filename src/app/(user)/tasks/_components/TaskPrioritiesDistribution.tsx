'use client'

import TaskMetricsCard from '@/app/(user)/tasks/_components/TaskMetricsCard'
import styles from './TaskPrioritiesDistribution.module.scss'
import PieChart from '@/lib/ui/PieChart'

interface TaskTypesContributionProps {}

export const priorityDistribution = [
  {
    label: 'critical',
    count: 40,
    fill: 'var(--chart-6)',
  },
  {
    label: 'high',
    count: 20,
    fill: 'var(--chart-7)',
  },
  {
    label: 'medium',
    count: 15,
    fill: 'var(--chart-8)',
  },
  {
    label: 'low',
    count: 25,
    fill: 'var(--chart-9)',
  },
]

export default function TaskPrioritiesDistribution(
  props: TaskTypesContributionProps,
) {
  const {} = props
  return (
    <TaskMetricsCard
      title="Priorities"
      className={styles.card}
      bodyProps={{
        className: styles.body,
      }}
    >
      <PieChart
        data={priorityDistribution}
        innerRadius={25}
        className={styles.chart}
      />
    </TaskMetricsCard>
  )
}
