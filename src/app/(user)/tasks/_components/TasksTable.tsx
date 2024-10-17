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
import { addDays, differenceInDays, format, isSameDay } from 'date-fns'

interface TasksTableProps {
  tasks: Tasks
}

export default function TasksTable(props: TasksTableProps) {
  const { tasks } = props
  const [searchTerm, setSearchTerm] = useState('')
  return (
    <div className={styles.main}>
      <div className={styles.container}>
        <div className={cn(styles.header, 'border-b')}>
          <TasksTableFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            date={undefined}
            setDate={(range) => {
              //
            }}
          />
          <Button
            variant="outline"
            className={styles['clear-button']}
            onClick={() => {}}
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
