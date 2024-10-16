import TaskTypesDistribution from '@/app/(user)/tasks/_components/TaskTypesDistribution'
import styles from './TaskMetrics.module.scss'
import TaskMetricsNumbers from '@/app/(user)/tasks/_components/TaskMetricsNumbers'
import TaskPrioritiesDistribution from '@/app/(user)/tasks/_components/TaskPrioritiesDistribution'
import { Tasks } from '@/app/(user)/tasks/_components/get-tasks'

interface TaskMetricsProps {
  tasks: Tasks
}

export default function TaskMetrics(props: TaskMetricsProps) {
  const { tasks } = props
  return (
    <div className={styles.main}>
      <div className={styles.content}>
        <TaskTypesDistribution tasks={tasks} />
        <TaskMetricsNumbers tasks={tasks} />
        <TaskPrioritiesDistribution tasks={tasks} />
      </div>
    </div>
  )
}
