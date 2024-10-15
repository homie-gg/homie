'use client'

import clsx from 'clsx'
import DataTable from '@/lib/ui/HomieDataTable'
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

interface TasksTableProps {}

export default function TasksTable(props: TasksTableProps) {
  const {} = props
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
                <TableCell>Created At</TableCell>
                <TableCell>Est. Completion Date</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  Implement Search Functionality with Filters
                </TableCell>
                <TableCell>Low</TableCell>
                <TableCell>Oct 15, 2024</TableCell>
                <TableCell>Oct 15, 2024</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  )
}
