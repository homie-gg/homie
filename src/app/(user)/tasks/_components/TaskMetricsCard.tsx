import { PropsWithChildren } from 'react'
import styles from './TaskMetrics.module.scss'
import clsx from 'clsx'

interface TaskMetricsCardProps extends PropsWithChildren {
  title: string
  className?: string
  bodyProps?: {
    className?: string
  }
}

export default function TaskMetricsCard(props: TaskMetricsCardProps) {
  const { title, children, className, bodyProps } = props
  return (
    <div className={clsx(styles.card, className)}>
      <div className={styles['card-header']}>
        <p className={styles['card-heading']}>{title}</p>
      </div>
      <div className={clsx(styles['card-body'], bodyProps?.className)}>
        {children}
      </div>
    </div>
  )
}
