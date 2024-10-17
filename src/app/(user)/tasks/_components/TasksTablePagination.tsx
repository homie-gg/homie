import { Button } from '@/lib/ui/HomieButton'
import styles from './TasksTablePagination.module.scss'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import TasksTablePaginationPageButton from '@/app/(user)/tasks/_components/TasksTablePaginationPageButton'
import TasksTablePaginationEllipseButton from '@/app/(user)/tasks/_components/TasksTablePaginationEllipseButton'

interface TasksTablePaginationProps {
  total: number
  current: number
  onChange: (page: number) => void
}

export default function TasksTablePagination(props: TasksTablePaginationProps) {
  const { total: totalPages, current: currentPage, onChange: setPage } = props

  return (
    <div className={styles.container}>
      <Button
        variant="outline"
        className={styles.action}
        disabled={currentPage === 1}
        onClick={() => setPage(currentPage - 1)}
      >
        <ArrowLeft />
        Previous
      </Button>
      <div className={styles['tags-container']}>
        {totalPages > 7 ? (
          <>
            {new Array(3).fill(null).map((_, index) => (
              <TasksTablePaginationPageButton
                key={index}
                page={index + 1}
                isActive={currentPage === index + 1}
                onClick={() => setPage(index + 1)}
              />
            ))}
            {currentPage > 3 && (
              <TasksTablePaginationEllipseButton onClick={() => setPage(3)} />
            )}
            {currentPage > 3 && currentPage <= totalPages - 3 && (
              <TasksTablePaginationPageButton
                page={currentPage}
                isActive
                onClick={() => setPage(currentPage)}
              />
            )}
            {currentPage < totalPages - 3 && (
              <TasksTablePaginationEllipseButton
                onClick={() => setPage(totalPages - 3)}
              />
            )}
            {new Array(3).fill(null).map((_, index) => {
              const tag = totalPages + (index + 1 - 3)

              return (
                <TasksTablePaginationPageButton
                  key={tag}
                  page={tag}
                  isActive={currentPage === tag}
                  onClick={() => setPage(tag)}
                />
              )
            })}
          </>
        ) : (
          new Array(totalPages)
            .fill(null)
            .map((_, index) => (
              <TasksTablePaginationPageButton
                key={index}
                page={index + 1}
                isActive={currentPage === index + 1}
                onClick={() => setPage(index + 1)}
              />
            ))
        )}
      </div>
      <Button
        variant="outline"
        className={styles.action}
        disabled={currentPage === totalPages}
        onClick={() => setPage(currentPage + 1)}
      >
        Next
        <ArrowRight />
      </Button>
    </div>
  )
}
