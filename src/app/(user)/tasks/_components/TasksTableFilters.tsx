import { DateRange } from 'react-day-picker'
import styles from './TasksTableFilters.module.scss'
import { useState } from 'react'
import TasksTableSearch from '@/app/(user)/tasks/_components/TasksTableSearch'
import TaskPriorityFilter, {
  TaskPriorityFilterValue,
} from '@/app/(user)/tasks/_components/TaskPriorirtyFilter'
import DatePicker from '@/lib/ui/DatePicker'
import { cn } from '@/lib/utils'
import { parseAsStringLiteral, ParserBuilder, useQueryState } from 'nuqs'
import { taskPriority } from '@/lib/tasks/task-priority'

interface TasksTableFiltersProps {
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  date?: DateRange
  setDate: (date?: DateRange) => void
}

const taskCategoryParser: ParserBuilder<TaskPriorityFilterValue> =
  parseAsStringLiteral(['any', ...Object.keys(taskPriority)] as any)

export default function TasksTableFilters(props: TasksTableFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const [date, setDate] = useState<DateRange>()
  const [priority, setPriority] = useQueryState(
    'priority',
    taskCategoryParser.withDefault('any'),
  )

  const {} = props
  return (
    <div className={styles.container}>
      <div className={cn(styles.item, styles.search)}>
        <span className={styles.label}>Search for tasks</span>
        <TasksTableSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </div>
      <div className={styles.item}>
        <span className={styles.label}>Priority</span>
        <TaskPriorityFilter value={priority} onChange={setPriority} />
      </div>
      <div className={styles.item}>
        <span className={styles.label}>Added At</span>
        <DatePicker
          date={date}
          setDate={setDate}
          className={styles['date-picker']}
        />
      </div>
    </div>
  )
}
