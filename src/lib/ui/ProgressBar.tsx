import clsx from 'clsx'
import styles from './ProgressBar.module.scss'

type Props = {
  progress: number
  hidePercentage?: boolean
  className?: string
}

const ProgressBar: React.FC<Props> = ({
  progress,
  hidePercentage = false,
  className = '',
}) => {
  return (
    <div className={clsx(styles.container, className)}>
      <div className={styles.bar}>
        <span
          style={{
            width: `${progress}%`,
          }}
        />
      </div>
      {!hidePercentage && <span className={styles.label}>{progress}%</span>}
    </div>
  )
}

export default ProgressBar
