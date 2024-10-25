'use client'

import TaskMetricsCard from '@/app/(user)/tasks/_components/TaskMetricsCard'
import styles from './TaskPrioritiesDistribution.module.scss'
import PieChart from '@/lib/ui/PieChart'
import { Tasks } from './get-tasks'

interface TaskTypesContributionProps {
  tasks: Tasks
}

export default function TaskPrioritiesDistribution(
  props: TaskTypesContributionProps,
) {
  const { tasks } = props
  return (
    <TaskMetricsCard
      title="Priorities"
      className={styles.card}
      bodyProps={{
        className: styles.body,
      }}
    >
      <PieChart
        data={[
          {
            label: 'critical',
            count: tasks.task_priorities['0'],
            fill: 'var(--chart-7)',
          },
          {
            label: 'high',
            count: tasks.task_priorities['1'],
            fill: 'var(--chart-8)',
          },
          {
            label: 'medium',
            count: tasks.task_priorities['2'],
            fill: 'var(--chart-9)',
          },
          {
            label: 'low',
            count: tasks.task_priorities['3'],
            fill: 'var(--chart-6)',
          },
        ]}
        innerRadius={25}
        className={styles.chart}
      />
    </TaskMetricsCard>
  )
}
