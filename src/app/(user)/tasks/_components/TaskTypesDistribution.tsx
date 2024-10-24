import TaskMetricsCard from '@/app/(user)/tasks/_components/TaskMetricsCard'
import styles from './TaskTypesDistribution.module.scss'
import ProgressBar from '@/lib/ui/ProgressBar'
import { Tasks } from '@/app/(user)/contributor/[user_id]/_components/get-tasks'

interface TaskTypesContributionProps {
  tasks: Tasks
}

export default function TaskTypesDistribution(
  props: TaskTypesContributionProps,
) {
  const { tasks } = props

  return (
    <TaskMetricsCard title="Types">
      <ul className={styles['data-list']}>
        {tasks.task_types.map(({ type, count }, index) => (
          <li key={index} className={styles['data-item']}>
            <span className={styles['data-label']}>{getTypeLabel(type)}</span>
            <ProgressBar
              progress={Math.round((100 * count) / tasks.total)}
              className={styles.progress}
            />
          </li>
        ))}
      </ul>
    </TaskMetricsCard>
  )
}

function getTypeLabel(type: string) {
  switch (type) {
    case 'feature':
      return 'Feature'
    case 'bug_fix':
      return 'Bug Fix'
    case 'maintenance':
      return 'Maintenance'
    case 'planning':
      return 'Planning'
    default:
      return 'Unknown'
  }
}
