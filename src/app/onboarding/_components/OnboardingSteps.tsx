'use client'

import clsx from 'clsx'
import styles from './OnboardingSteps.module.scss'
import OnboardingNav from '@/app/onboarding/_components/OnboardingNav'

export default function OnboardingSteps() {
  return (
    <div className={styles.root}>
      <div className={clsx('container', styles.content)}>
        <OnboardingNav activeStep="connect_repo" />
      </div>
    </div>
  )
}
