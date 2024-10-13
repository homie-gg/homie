import TaskTypesContribution from '@/app/(user)/tasks/_components/TaskTypesContribution'
import styles from './TaskMetrics.module.scss'
import TaskMetricsNumbers from '@/app/(user)/tasks/_components/TaskMetricsNumbers'

interface TaskMetricsProps {}

export default function TaskMetrics(props: TaskMetricsProps) {
  const {} = props
  return (
    <div className={styles.main}>
      <div className={styles.content}>
        <TaskTypesContribution />
        <TaskMetricsNumbers />
      </div>
    </div>
  )
}