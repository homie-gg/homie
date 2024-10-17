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
import { parseAsStringLiteral, ParserBuilder, useQueryState } from 'nuqs'
import { taskPriority } from '@/lib/tasks/task-priority'
import { useDebounce } from 'react-use'
import { TaskPriorityFilterValue } from '@/app/(user)/tasks/_components/TaskPriorirtyFilter'

interface TasksTableProps {
  tasks: Tasks
}

const taskCategoryParser: ParserBuilder<TaskPriorityFilterValue> =
  parseAsStringLiteral(['any', ...Object.keys(taskPriority)] as any)

export default function TasksTable(props: TasksTableProps) {
  const { tasks } = props

  const [searchInput, setSearchInput] = useState('')
  const [date, setDate] = useState<DateRange>()
  const [priority, setPriority] = useQueryState(
    'priority',
    taskCategoryParser.withDefault('any'),
  )
  const [debouncedSearch, setDebouncedSearch] = useQueryState('search')

  useDebounce(
    () => {
      setDebouncedSearch(searchInput)
    },
    1500,
    [searchInput],
  )

  const clearFilters = () => {
    setSearchInput('')
    setDebouncedSearch('')
    setDate(undefined)
    setPriority('any')
  }

  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <div className={cn(styles.header, 'border-b')}>
          <TasksTableFilters
            searchTerm={searchInput}
            setSearchTerm={setSearchInput}
            date={undefined}
            setDate={(range) => {
              //
            }}
            priority={priority}
            setPriority={setPriority}
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
                <TableCell>Added At</TableCell>
                <TableCell>Est. Completion Date</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.data.map((task) => (
                <TableRow key={task.id}>
                  <TableCell>{task.name}</TableCell>
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
          totalPages={10}
          currentPage={2}
          setPage={() => {}}
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
