'use client'

import clsx from 'clsx'
import styles from './OnboardingSteps.module.scss'
import OnboardingNav from '@/app/onboarding/_components/OnboardingNav'
import { useState } from 'react'
import { OnboardingStep } from '@/app/onboarding/_components/onboarding-step'
import DetailsStep from '@/app/onboarding/_components/DetailsStep'
import ConnectRepoStep from '@/app/onboarding/_components/ConnectRepoStep'
import ConnectSlackStep from '@/app/onboarding/_components/ConnectSlackStep'
import { OnboardingOrganization } from '@/app/onboarding/types'

interface OnboardingProps {
  organization: OnboardingOrganization
}

export default function Onboarding(props: OnboardingProps) {
  const [organization, setOrganization] = useState(props.organization)
  const step = getStep(organization)

  return (
    <div className={styles.root}>
      <div className={clsx('container', styles.content)}>
        <OnboardingNav activeStep={step} />
        {step === 'fill_details' && (
          <DetailsStep
            organization={organization}
            onUpdateOrganization={setOrganization}
          />
        )}
        {step === 'connect_repo' && <ConnectRepoStep />}
        {step === 'connect_slack' && <ConnectSlackStep />}
      </div>
    </div>
  )
}

function getStep(
  organization: OnboardingProps['organization'],
): OnboardingStep {
  if (!organization.owner_name) {
    return 'fill_details'
  }

  if (!organization.ext_gh_install_id || !organization.gitlab_access_token) {
    return 'connect_repo'
  }

  return 'connect_slack'
}
