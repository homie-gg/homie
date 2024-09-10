import styles from './DetailsStep.module.scss'
import Image from 'next/image'
import homieImage from './homie-right.svg'
import DetailsForm from '@/app/onboarding/_components/DetailsForm'

interface DetailsStepProps {
  showing: boolean
}

export default function DetailsStep(props: DetailsStepProps) {
  const { showing } = props
  if (!showing) {
    return null
  }
  return (
    <div className={styles['root']}>
      <div className={styles['form-container']}>
        <h1 className={styles['heading']}>Let&apos;s get to know you better</h1>
        <DetailsForm />
      </div>

      <div className={styles['container-bg']}>
        <Image width={180} height={180} src={homieImage} alt="Homie" />
      </div>
    </div>
  )
}
