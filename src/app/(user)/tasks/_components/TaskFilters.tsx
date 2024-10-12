import TaskFilterItem from '@/app/(user)/tasks/_components/TaskFilterItem'
import styles from '@/app/(user)/tasks/_components/TaskFilters.module.scss'

interface TaskFiltersProps {}

const filters = [
  {
    value: 'all',
    label: 'All Tasks',
  },
  {
    value: 'this_week',
    label: 'This Week',
  },
  {
    value: 'new_tasks',
    label: 'New Tasks',
  },
  {
    value: 'unassigned',
    label: 'Unassigned',
  },
  {
    value: 'stale',
    label: 'Stale Tasks',
  },
] as const

export default function TaskFilters(props: TaskFiltersProps) {
  const {} = props
  return (
    <div className={styles.container}>
      <ul className={styles.content}>
        {filters.map((filter) => (
          <TaskFilterItem
            value={filter.value}
            key={filter.value}
            isActive={filter.value === 'all'}
          >
            {filter.label}
          </TaskFilterItem>
        ))}
      </ul>
    </div>
  )
}
