import TaskMetricsCard from '@/app/(user)/tasks/_components/TaskMetricsCard'
import styles from './TaskMetricsNumbers.module.scss'
import { Tasks } from '@/app/(user)/tasks/_components/get-tasks'

interface TaskMetricsNumbersProps {
  tasks: Tasks
}
export default function TaskMetricsNumbers(props: TaskMetricsNumbersProps) {
  const { tasks } = props
  return (
    <TaskMetricsCard title="Metrics">
      <ul className={styles['data-list']}>
        <li className={styles['data-item']}>
          <span className={styles['data-label']}>Pending Tasks</span>
          <span className={styles['data-value']}>{tasks.total} tasks</span>
        </li>
        <li className={styles['data-item']}>
          <span className={styles['data-label']}>Estimated number of days</span>
          <span className={styles['data-value']}>25 days</span>
        </li>
        <li className={styles['data-item']}>
          <span className={styles['data-label']}>Stale Tasks</span>
          <span className={styles['data-value']}>12 tasks</span>
        </li>
      </ul>
    </TaskMetricsCard>
  )
}
