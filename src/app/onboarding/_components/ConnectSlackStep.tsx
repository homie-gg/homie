import styles from './ConnectSlackStep.module.scss'
import Image from 'next/image'
import { Button } from '@/lib/ui/HomieButton'
import SlackIcon from '@/app/onboarding/_components/SlackIcon'
import homieImage from './homie-down.svg'
import { getSlackInstallUrl } from '@/lib/slack/get-slack-install-url'
import { OnboardingOrganization } from '@/app/onboarding/types'

interface ConnectSlackStep {
  organization: OnboardingOrganization
}

export default function ConnectSlackStep(props: ConnectSlackStep) {
  const { organization } = props

  return (
    <div className={styles['container']}>
      <div className={styles['content']}>
        <h1 className={styles['heading']}>Now let’s link to your Slack</h1>
        <div className={styles['action']}>
          <a href={getSlackInstallUrl({ organization })}>
            <Button variant="outline" className={styles.button}>
              <span>
                <SlackIcon />
              </span>
              <span>Connect Slack</span>
            </Button>
          </a>
        </div>
      </div>

      <div className={styles['container-bg']}>
        <Image
          width={360}
          height={106}
          sizes="512px"
          src={homieImage}
          alt="Homie"
        />
      </div>
    </div>
  )
}
