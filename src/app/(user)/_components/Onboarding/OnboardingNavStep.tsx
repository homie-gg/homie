import clsx from 'clsx'
import styles from '@/app/(user)/_components/Onboarding/OnboardingNavStep.module.scss'
import CheckMarkIcon from '@/app/(user)/_components/Onboarding/CheckMarkIcon'

interface OnboardingNavStepProps {
  state: 'pending' | 'active' | 'done'
  label: string
}

export default function OnboardingNavStep(props: OnboardingNavStepProps) {
  const { state, label } = props
  return (
    <div
      className={clsx(styles.root, {
        [styles['item--active']]: state === 'active',
        [styles['item--done']]: state === 'done',
      })}
    >
      <div className={styles['item-tag']}>
        <span className={styles['check']}>
          <CheckMarkIcon />
        </span>
        <span className={styles['tag-center']}>
          <span className={styles['tag-ring']} />
        </span>
      </div>
      <p className={styles['item-label']}>{label}</p>
    </div>
  )
}
