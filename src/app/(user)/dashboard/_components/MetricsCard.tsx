import clsx from 'clsx'
import styles from './MetricsCard.module.scss'

interface MetricsProps {
  color: 'amber' | 'green' | 'orchid' | 'violet'
  label: string
  body: string
  icon: JSX.Element
}

export default function Metrics(props: MetricsProps) {
  const { color, label, body, icon } = props
  return (
    <div className={clsx(styles.root, styles[color])}>
      <div className={styles.icon}>{icon}</div>
      <div className={styles.data}>
        <p className={styles['data-label']}>{label}</p>
        <p className={styles['data-text']}>{body}</p>
      </div>
    </div>
  )
}
