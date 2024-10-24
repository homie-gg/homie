import TaskMetricsCard from '@/app/(user)/tasks/_components/TaskMetricsCard'
import styles from './TaskMetricsNumbers.module.scss'
import { Tasks } from './get-tasks'

interface TaskMetricsNumbersProps {
  tasks: Tasks
}
export default function TaskMetricsNumbers(props: TaskMetricsNumbersProps) {
  const { tasks } = props
  return (
    <TaskMetricsCard title="Metrics">
      <ul className={styles['data-list']}>
        <li className={styles['data-item']}>
          <span className={styles['data-label']}>Open Tasks</span>
          <span className={styles['data-value']}>{tasks.total} tasks</span>
        </li>
        <li className={styles['data-item']}>
          <span className={styles['data-label']}>Estimated number of days</span>
          <span className={styles['data-value']}>
            {tasks.total_estimated_days_to_complete} days
          </span>
        </li>
        <li className={styles['data-item']}>
          <span className={styles['data-label']}>Stale Tasks</span>
          <span className={styles['data-value']}>
            {tasks.num_stale_tasks} tasks
          </span>
        </li>
      </ul>
    </TaskMetricsCard>
  )
}
