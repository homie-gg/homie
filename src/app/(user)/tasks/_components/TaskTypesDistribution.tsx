import TaskMetricsCard from '@/app/(user)/tasks/_components/TaskMetricsCard'
import styles from './TaskTypesDistribution.module.scss'
import ProgressBar from '@/lib/ui/ProgressBar'

interface TaskTypesContributionProps {}

export const contributionMetrics = [
  {
    label: 'Data 1',
    progress: 50,
  },
  {
    label: 'Data 2',
    progress: 30,
  },
  {
    label: 'Data 3',
    progress: 60,
  },
  {
    label: 'Data 4',
    progress: 10,
  },
  {
    label: 'Data 5',
    progress: 5,
  },
]

export default function TaskTypesDistribution(
  props: TaskTypesContributionProps,
) {
  const {} = props
  return (
    <TaskMetricsCard title="Types">
      <ul className={styles['data-list']}>
        {contributionMetrics.map(({ label, progress }, index) => (
          <li key={index} className={styles['data-item']}>
            <span className={styles['data-label']}>{label}</span>
            <ProgressBar progress={progress} className={styles.progress} />
          </li>
        ))}
      </ul>
    </TaskMetricsCard>
  )
}
