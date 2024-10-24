import { Button } from '@/lib/ui/HomieButton'
import { cn } from '@/lib/utils'
import styles from './TasksTablePagination.module.scss'

interface TasksTablePaginationPageButtonProps {
  isActive?: boolean
  onClick: () => void
  page: number
}

export default function TasksTablePaginationPageButton(
  props: TasksTablePaginationPageButtonProps,
) {
  const { isActive, onClick, page } = props
  return (
    <Button
      variant="ghost"
      className={cn(styles.tag, {
        [styles['tag--active']]: isActive,
      })}
      onClick={onClick}
    >
      {page}
    </Button>
  )
}
