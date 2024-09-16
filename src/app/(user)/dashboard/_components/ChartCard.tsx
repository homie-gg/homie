import { PropsWithChildren } from 'react'
import clsx from 'clsx'
import styles from './ChartCard.module.scss'
import { Button } from '@/lib/ui/HomieButton'

interface ChartCardProps extends PropsWithChildren {
  color?: 'amber' | 'green' | 'violet' | 'orchid' | 'blue'
  title: string
  tag?: string
  action?: {
    label: string
    handler: (e: React.MouseEvent<HTMLButtonElement>) => void
  }
  className?: string
}

export default function ChartCard(props: ChartCardProps) {
  const { color = 'amber', title, tag, action, className, children } = props
  return (
    <div
      data-theme={color}
      className={clsx(styles.container, styles[color], className)}
    >
      <div className={styles.header}>
        <div className={styles['header-main']}>
          <p className={styles.title}>{title}</p>
          {tag && <span className={styles.tag}>{tag}</span>}
        </div>
        {action && (
          <Button
            variant="outline"
            size="sm"
            className={styles['header-action']}
            onClick={action.handler}
          >
            {action.label}
          </Button>
        )}
      </div>
      <div className={styles.body}>{children}</div>
    </div>
  )
}
