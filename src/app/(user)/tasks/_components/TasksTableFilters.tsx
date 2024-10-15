import { DateRange } from 'react-day-picker'
import styles from './TasksTableFilters.module.scss'
import { useState } from 'react'
import TasksTableSearch from '@/app/(user)/tasks/_components/TasksTableSearch'
import TasksStatusFilter from '@/app/(user)/tasks/_components/TasksStatusFilter'
import DatePicker from '@/lib/ui/DatePicker'
import { cn } from '@/lib/utils'

interface TasksTableFiltersProps {
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  date?: DateRange
  setDate: (date?: DateRange) => void
}

export default function TasksTableFilters(props: TasksTableFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const [date, setDate] = useState<DateRange>()

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
        <span className={styles.label}>Task Status</span>
        <TasksStatusFilter />
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
