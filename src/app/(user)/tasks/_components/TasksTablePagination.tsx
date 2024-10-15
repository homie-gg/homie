import { Button } from '@/lib/ui/HomieButton'
import styles from './TasksTablePagination.module.scss'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import TasksTablePaginationPageButton from '@/app/(user)/tasks/_components/TasksTablePaginationPageButton'
import TasksTablePaginationEllipseButton from '@/app/(user)/tasks/_components/TasksTablePaginationEllipseButton'

interface TasksTablePaginationProps {
  totalPages: number
  currentPage: number
  setPage: (page: number) => void
}

export default function TasksTablePagination(props: TasksTablePaginationProps) {
  const { totalPages, currentPage, setPage } = props

  const handleTag = (tag: number) => {
    setPage(tag)
  }

  return (
    <div className={styles.container}>
      <Button
        variant="outline"
        className={styles.action}
        disabled={currentPage === 0}
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
                isActive={currentPage === index}
                onClick={() => handleTag(index)}
              />
            ))}
            {currentPage > 3 && (
              <TasksTablePaginationEllipseButton onClick={() => handleTag(3)} />
            )}
            {currentPage >= 3 && currentPage < totalPages - 3 && (
              <TasksTablePaginationPageButton
                page={currentPage}
                isActive
                onClick={() => handleTag(currentPage)}
              />
            )}
            {currentPage < totalPages - 4 && (
              <TasksTablePaginationEllipseButton
                onClick={() => handleTag(totalPages - 4)}
              />
            )}
            {new Array(3).fill(null).map((_, index) => {
              const tag = totalPages + (index - 3)

              return (
                <TasksTablePaginationPageButton
                  key={tag}
                  page={tag}
                  isActive={currentPage === tag}
                  onClick={() => handleTag(tag)}
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
                isActive={currentPage === index}
                onClick={() => handleTag(index)}
              />
            ))
        )}
      </div>
      <Button
        variant="outline"
        className={styles.action}
        disabled={currentPage === totalPages - 1}
        onClick={() => setPage(currentPage + 1)}
      >
        Next
        <ArrowRight />
      </Button>
    </div>
  )
}
