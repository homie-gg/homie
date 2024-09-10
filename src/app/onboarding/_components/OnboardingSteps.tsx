'use client'

import clsx from 'clsx'
import styles from './OnboardingSteps.module.scss'
import OnboardingNav from '@/app/onboarding/_components/OnboardingNav'
import { useState } from 'react'
import { OnboardingStep } from '@/app/onboarding/_components/onboarding-step'
import DetailsStep from '@/app/onboarding/_components/DetailsStep'

export default function OnboardingSteps() {
  const [step, setStep] = useState<OnboardingStep>('fill_details')

  return (
    <div className={styles.root}>
      <div className={clsx('container', styles.content)}>
        <OnboardingNav activeStep={step} />
        <DetailsStep showing={step === 'fill_details'} />
      </div>
    </div>
  )
}
