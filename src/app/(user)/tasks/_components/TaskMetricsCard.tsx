import { PropsWithChildren } from 'react'
import styles from './TaskMetrics.module.scss'

interface TaskMetricsCardProps extends PropsWithChildren {
  title: string
}

export default function TaskMetricsCard(props: TaskMetricsCardProps) {
  const { title, children } = props
  return (
    <div className={styles.card}>
      <div className={styles['card-header']}>
        <p className={styles['card-heading']}>{title}</p>
      </div>
      <div className={styles['card-body']}>{children}</div>
    </div>
  )
}
