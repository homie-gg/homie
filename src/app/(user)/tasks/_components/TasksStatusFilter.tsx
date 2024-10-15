import Select, { Option } from '@/lib/ui/HomieSelect'
import filterStyles from './TasksTableFilters.module.scss'
import styles from './TasksStatusFilter.module.scss'
import { taskStatus } from '@/lib/tasks/task-status'

export type TaskStatus = keyof typeof taskStatus | 'any'

export const statusOptions: { value: TaskStatus; label: string }[] = [
  {
    value: 'any',
    label: 'Any',
  },
  {
    value: 'open',
    label: 'Open',
  },
  {
    value: 'done',
    label: 'Done',
  },
]

interface TasksStatusFilterProps {}

export default function TasksStatusFilter(props: TasksStatusFilterProps) {
  const {} = props
  return (
    <Select
      instanceId="1"
      options={statusOptions.map((option) => formatOption(option))}
      defaultValue={formatOption(statusOptions[0]) as any}
      theme={(theme) => ({
        ...theme,
        colors: {
          ...theme.colors,
          primary: 'hsl(var(--primary))',
        },
      })}
      className={filterStyles.select}
      controlClassName={filterStyles['select-control']}
    />
  )
}

const formatOption = ({ value, label }: Option) => ({
  value,
  label: (
    <span data-tag={value} className={styles.option}>
      {label}
    </span>
  ),
})
