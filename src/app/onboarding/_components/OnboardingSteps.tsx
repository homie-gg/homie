'use client'

import clsx from 'clsx'
import styles from './OnboardingSteps.module.scss'
import OnboardingNav from '@/app/onboarding/_components/OnboardingNav'
import { useState } from 'react'
import { OnboardingStep } from '@/app/onboarding/_components/onboarding-step'
import DetailsStep from '@/app/onboarding/_components/DetailsStep'
import ConnectRepoStep from '@/app/onboarding/_components/ConnectRepoStep'
import ConnectSlackStep from '@/app/onboarding/_components/ConnectSlackStep'

export default function OnboardingSteps() {
  const [step, setStep] = useState<OnboardingStep>('connect_slack')

  return (
    <div className={styles.root}>
      <div className={clsx('container', styles.content)}>
        <OnboardingNav activeStep={step} />
        {step === 'fill_details' && <DetailsStep />}
        {step === 'connect_repo' && <ConnectRepoStep />}
        {step === 'connect_slack' && <ConnectSlackStep />}
      </div>
    </div>
  )
}
