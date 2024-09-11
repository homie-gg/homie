import OnboardingNavStep from '@/app/(user)/_components/Onboarding/OnboardingNavStep'
import styles from './OnboardingNav.module.scss'
import { OnboardingStep } from '@/app/(user)/_components/Onboarding/onboarding-step'

interface OnboardingNavProps {
  activeStep: OnboardingStep
}

const steps: Array<{
  value: OnboardingStep
  label: string
}> = [
  {
    value: 'fill_details',
    label: 'Your details',
  },
  { value: 'connect_repo', label: 'Connect repository' },
  { value: 'connect_slack', label: 'Connect Slack' },
]

export default function OnboardingNav(props: OnboardingNavProps) {
  const { activeStep } = props
  return (
    <div className={styles.root}>
      {steps.map((step) => (
        <OnboardingNavStep
          key={step.value}
          state={getState(step.value, activeStep)}
          label={step.label}
        />
      ))}
    </div>
  )
}

function getState(step: OnboardingStep, activeStep: OnboardingStep) {
  const currentIndex = steps.map((step) => step.value).indexOf(step)
  const activeIndex = steps.map((step) => step.value).indexOf(activeStep)

  if (currentIndex === activeIndex) {
    return 'active'
  }

  if (currentIndex < activeIndex) {
    return 'done'
  }

  return 'pending'
}
