'use client'

import styles from './TasksTable.module.scss'
import { Button } from '@/lib/ui/HomieButton'
import { useState } from 'react'
import TasksTableFilters from '@/app/(user)/tasks/_components/TasksTableFilters'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/lib/ui/HomieTable'
import { cn } from '@/lib/utils'
import TasksTablePagination from '@/app/(user)/tasks/_components/TasksTablePagination'
import { Tasks } from '@/app/(user)/tasks/_components/get-tasks'
import { format } from 'date-fns'
import { DateRange } from 'react-day-picker'
import {
  parseAsStringLiteral,
  parseAsInteger,
  ParserBuilder,
  useQueryState,
} from 'nuqs'
import { taskPriority } from '@/lib/tasks/task-priority'
import { useDebounce } from 'react-use'
import { TaskPriorityFilterValue } from '@/app/(user)/tasks/_components/TaskPriorirtyFilter'
import { formatDate, parse } from 'date-fns'

interface TasksTableProps {
  tasks: Tasks
}

const taskCategoryParser: ParserBuilder<TaskPriorityFilterValue> =
  parseAsStringLiteral(['any', ...Object.keys(taskPriority)] as any)

export default function TasksTable(props: TasksTableProps) {
  const { tasks } = props

  const [searchInput, setSearchInput] = useState('')
  const [priority, setPriority] = useQueryState('priority', {
    ...taskCategoryParser.withDefault('any'),
    shallow: false,
  })
  const [addedFromDate, setAddedFromDate] = useQueryState('added_from', {
    shallow: false,
  })
  const [addedToDate, setAddedToDate] = useQueryState('added_to', {
    shallow: false,
  })
  const [_debouncedSearch, setDebouncedSearch] = useQueryState('search', {
    shallow: false,
  })
  const [page, setPage] = useQueryState('page', {
    ...parseAsInteger,
    shallow: false,
  })

  const handleSetDate = (date?: DateRange) => {
    setAddedFromDate(date?.from ? formatDate(date?.from, 'yyyy-MM-dd') : null)
    setAddedToDate(date?.to ? formatDate(date?.to, 'yyyy-MM-dd') : null)
  }

  useDebounce(
    () => {
      setDebouncedSearch(searchInput)
    },
    500,
    [searchInput],
  )

  const clearFilters = () => {
    setSearchInput('')
    setDebouncedSearch(null)
    handleSetDate(undefined)
    setPriority(null)
  }

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <div className={cn(styles.header, 'border-b')}>
          <TasksTableFilters
            searchTerm={searchInput}
            setSearchTerm={(term) => {
              setPage(null)
              setSearchInput(term)
            }}
            date={{
              from: addedFromDate
                ? parse(addedFromDate, 'yyyy-MM-dd', new Date())
                : undefined,
              to: addedToDate
                ? parse(addedToDate, 'yyyy-MM-dd', new Date())
                : undefined,
            }}
            setDate={(date) => {
              setPage(null)
              handleSetDate(date)
            }}
            priority={priority}
            setPriority={(priority) => {
              setPage(null)
              setPriority(priority)
            }}
          />
          <Button
            variant="outline"
            className={styles['clear-button']}
            onClick={clearFilters}
          >
            Clear all
          </Button>
        </div>
        <div className={styles.body}>
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>Task</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Added</TableCell>
                <TableCell>Est. Completion Date</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.data.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>
                    <a
                      href={task.html_url}
                      className={styles['name-link']}
                      target="_blank"
                    >
                      {task.name}
                    </a>
                  </TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        styles['priority-tag'],
                        styles[`priority-${task.priority_level}`],
                      )}
                    >
                      {getPriorityLabel(task.priority_level)}
                    </span>
                  </TableCell>
                  <TableCell>
                    {format(task.created_at, 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell>
                    {task.estimated_completion_date
                      ? format(task.created_at, 'MMM dd, yyyy')
                      : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <TasksTablePagination
          total={tasks.num_pages}
          current={page ?? 1}
          onChange={setPage}
        />
      </div>
    </div>
  )
}

function getPriorityLabel(priorityLevel: number) {
  switch (priorityLevel) {
    case 0:
      return 'Critical'
    case 1:
      return 'High'
    case 2:
      return 'Medium'
    case 3:
      return 'Low'
    default:
      return 'Low'
  }
}
