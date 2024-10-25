'use client'

import { PropsWithChildren } from 'react'
import styles from '@/app/(user)/tasks/_components/TaskCategorySelect.module.scss'
import clsx from 'clsx'
import { Button } from '@/lib/ui/HomieButton'
import { parseAsInteger, parseAsStringLiteral, useQueryState } from 'nuqs'

const taskCategories = [
  'all',
  'new_tasks',
  'due_this_week',
  'late',
  'unassigned',
  'stale',
] as const

export type TaskCategory = (typeof taskCategories)[number]

const taskCategoryParser = parseAsStringLiteral(taskCategories)

interface TaskFilterItemProps extends PropsWithChildren {
  value: TaskCategory
}

export default function TaskCategorySelectItem(props: TaskFilterItemProps) {
  const { value, children } = props

  const [category, setCategory] = useQueryState('category', {
    ...taskCategoryParser.withDefault('all'),
    shallow: false,
  })

  const [_page, setPage] = useQueryState('page', {
    ...parseAsInteger,
    shallow: false,
  })

  return (
    <div key={value} className={styles.item}>
      <Button
        variant="ghost"
        className={clsx(styles.action, {
          [styles['action--active']]: category === value,
        })}
        onClick={() => {
          setPage(null)
          setCategory(value)
        }}
      >
        {children}
      </Button>
    </div>
  )
}
