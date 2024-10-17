import Select, { Option } from '@/lib/ui/HomieSelect'
import filterStyles from './TasksTableFilters.module.scss'
import styles from './TaskPriorityFilter.module.scss'
import { taskPriority } from '@/lib/tasks/task-priority'
import { cn } from '@/lib/utils'

export type TaskPriorityFilterValue = keyof typeof taskPriority | 'any'

export const options: { value: TaskPriorityFilterValue; label: string }[] = [
  {
    value: 'any',
    label: 'Any',
  },
  {
    value: 'critical',
    label: 'Critical',
  },
  {
    value: 'high',
    label: 'High',
  },
  {
    value: 'medium',
    label: 'Medium',
  },
  {
    value: 'low',
    label: 'Low',
  },
]

interface TaskPriorityFilter {
  value: TaskPriorityFilterValue
  onChange: (value: TaskPriorityFilterValue) => void
}

export default function TaskPriorityFilter(props: TaskPriorityFilter) {
  const { value, onChange } = props

  return (
    <Select
      instanceId="1"
      value={
        getOptionElement(
          options.find((option) => option.value === value) as any,
        ) as any
      }
      onChange={(option: any) => onChange(option.value)}
      options={options.map((option) => getOptionElement(option))}
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

const getOptionElement = ({ value, label }: Option) => ({
  value,
  label: (
    <span className={cn(styles.option, styles[`priority-${value}`])}>
      {label}
    </span>
  ),
})
