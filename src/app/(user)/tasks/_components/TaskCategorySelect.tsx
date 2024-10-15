import styles from '@/app/(user)/tasks/_components/TaskCategorySelect.module.scss'
import TaskCategorySelectItem from '@/app/(user)/tasks/_components/TaskCategorySelectItem'

export default function TaskCategorySelect() {
  return (
    <div className={styles.container}>
      <ul className={styles.content}>
        <TaskCategorySelectItem value="all">All Tasks</TaskCategorySelectItem>
        <TaskCategorySelectItem value="this_week">
          This Week
        </TaskCategorySelectItem>
        <TaskCategorySelectItem value="new_tasks">
          New Tasks
        </TaskCategorySelectItem>
        <TaskCategorySelectItem value="unassigned">
          Unassigned
        </TaskCategorySelectItem>
        <TaskCategorySelectItem value="stale">
          Stale Tasks
        </TaskCategorySelectItem>
      </ul>
    </div>
  )
}
