import { Button } from '@/lib/ui/HomieButton'
import styles from './TasksTablePagination.module.scss'

interface TasksTablePaginationEllipseButtonProps {
  onClick: () => void
}

export default function TasksTablePaginationEllipseButton(
  props: TasksTablePaginationEllipseButtonProps,
) {
  const { onClick } = props
  return (
    <Button variant="ghost" className={styles.tag} onClick={onClick}>
      ...
    </Button>
  )
}
