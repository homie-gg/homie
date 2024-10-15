'use client'

import { PropsWithChildren } from 'react'
import styles from '@/app/(user)/tasks/_components/TaskCategorySelect.module.scss'
import clsx from 'clsx'
import { Button } from '@/lib/ui/HomieButton'
import { parseAsStringLiteral, useQueryState } from 'nuqs'

const taskCategories = [
  'all',
  'this_week',
  'new_tasks',
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

  return (
    <div key={value} className={styles.item}>
      <Button
        variant="ghost"
        className={clsx(styles.action, {
          [styles['action--active']]: category === value,
        })}
        onClick={() => {
          setCategory(value)
        }}
      >
        {children}
      </Button>
    </div>
  )
}
