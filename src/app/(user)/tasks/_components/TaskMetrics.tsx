import TaskTypesDistribution from '@/app/(user)/tasks/_components/TaskTypesDistribution'
import styles from './TaskMetrics.module.scss'
import TaskMetricsNumbers from '@/app/(user)/tasks/_components/TaskMetricsNumbers'
import TaskPrioritiesDistribution from '@/app/(user)/tasks/_components/TaskPrioritiesDistribution'

interface TaskMetricsProps {}

export default function TaskMetrics(props: TaskMetricsProps) {
  const {} = props
  return (
    <div className={styles.main}>
      <div className={styles.content}>
        <TaskTypesDistribution />
        <TaskMetricsNumbers />
        <TaskPrioritiesDistribution />
      </div>
    </div>
  )
}
