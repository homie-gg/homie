'use client'

import { PropsWithChildren } from 'react'
import styles from '@/app/(user)/tasks/_components/TaskFilters.module.scss'
import clsx from 'clsx'
import { Button } from '@/lib/ui/HomieButton'

interface TaskFilterItemProps extends PropsWithChildren {
  value: string
  isActive: boolean
}

export default function TaskFilterItem(props: TaskFilterItemProps) {
  const { value, children, isActive } = props
  return (
    <div key={value} className={styles.item}>
      <Button
        variant="ghost"
        className={clsx(styles.action, {
          [styles['action--active']]: isActive,
        })}
        onClick={() => {
          //
        }}
      >
        {children}
      </Button>
    </div>
  )
}
