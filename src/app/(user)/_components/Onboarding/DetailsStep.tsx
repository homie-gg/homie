import styles from './DetailsStep.module.scss'
import Image from 'next/image'
import homieImage from './homie-right.svg'
import DetailsForm, {
  OrganizationDetails,
} from '@/app/(user)/_components/Onboarding/DetailsForm'
import { OrganizationResponse } from '@/app/api/organizations/[organization_id]/types'
import { OnboardingOrganization } from '@/app/(user)/_components/Onboarding/types'
import { http } from '@/lib/http/client/http'

interface DetailsStepProps {
  organization: OnboardingOrganization
  onUpdateOrganization: (organization: OnboardingOrganization) => void
}

export default function DetailsStep(props: DetailsStepProps) {
  const { organization, onUpdateOrganization } = props

  const saveDetails = async (data: OrganizationDetails) => {
    const { organization: updated } = await http.patch<{
      organization: OrganizationResponse
    }>(`/api/organizations/${organization.id}`, {
      owner_name: data.ownerName,
      team_size: data.teamSize.value,
      target_features: data.targetFeatures
        .map((feature) => feature.value)
        .join(', '),
      referral_source: data.referralSource.value,
      homie_expectation: data.homieExpectation,
    })

    onUpdateOrganization({
      ...organization,
      owner_name: updated.owner_name,
    })
  }
  return (
    <div className={styles['root']}>
      <div className={styles['form-container']}>
        <h1 className={styles['heading']}>Let&apos;s get to know you better</h1>
        <DetailsForm onSubmit={saveDetails} />
      </div>

      <div className={styles['container-bg']}>
        <Image width={180} height={180} src={homieImage} alt="Homie" />
      </div>
    </div>
  )
}
