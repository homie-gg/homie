import { DateRange } from 'react-day-picker'
import styles from './TasksTableFilters.module.scss'

interface TasksTableFiltersProps {
  searchTerm: string
  setSearchTerm: (searchTerm: string) => void
  date?: DateRange
  setDate: (date?: DateRange) => void
}

export default function TasksTableFilters(props: TasksTableFiltersProps) {
  const {} = props
  return (
    <div className={styles.container}>
      {/* <div className={styles.item}>
        <span className={styles.label}>Search for tasks</span>
        <TasksTableSearch
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </div>
      <div className={styles.item}>
        <span className={styles.label}>Search for tasks</span>
        <ContributorsFilter />
      </div>
      <div className={styles.item}>
        <span className={styles.label}>Task Status</span>
        <StatusFilter />
      </div>
      <div className={styles.item}>
        <span className={styles.label}>Date</span>
        <DatePicker
          date={date}
          setDate={setDate}
          className={styles['date-picker']}
        />
      </div> */}
    </div>
  )
}
