import { PropsWithChildren } from 'react'
import styles from './ContributorMetricsCard.module.scss'

interface ContributorDataCardProps extends PropsWithChildren {
  label: string
}

export default function ContributorDataCard(props: ContributorDataCardProps) {
  const { label, children } = props
  return (
    <div className={styles.card}>
      <div className={styles.data}>
        <p className={styles.label}>{label}</p>
        <p className={styles.text}>{children}</p>
      </div>
    </div>
  )
}
