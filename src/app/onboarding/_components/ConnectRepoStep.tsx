import styles from './ConnectRepoStep.module.scss'
import Image from 'next/image'
import { Button } from '@/lib/ui/HomieButton'
import GithubIcon from '@/app/onboarding/_components/GithubIcon'
import GitlabIcon from '@/app/onboarding/_components/GitlabIcon'
import homieLeft from './homie-left.svg'
import { getGithubInstallUrl } from '@/lib/github/get-github-install-url'
import { OnboardingOrganization } from '@/app/onboarding/types'
import { getGitlabInstallUrl } from '@/lib/gitlab/get-install-gitlab-url'

interface ConnectRepoStepProps {
  organization: OnboardingOrganization
}

export default function ConnectRepoStep(props: ConnectRepoStepProps) {
  const { organization } = props

  return (
    <div className={styles['container']}>
      <div className={styles['content']}>
        <h1 className={styles['heading']}>Now let’s link your repository</h1>
        <div className={styles['action']}>
          <a href={getGithubInstallUrl({ organization })}>
            <Button variant="outline" className={styles.button}>
              <span>
                <GithubIcon />
              </span>
              <span>Connect Github</span>
            </Button>
          </a>
          <span>or</span>
          <a href={getGitlabInstallUrl({ organization })}>
            <Button variant="outline" className={styles.button}>
              <span>
                <GitlabIcon />
              </span>
              <span>Connect Gitlab</span>
            </Button>
          </a>
        </div>
      </div>
      <div className={styles['container-bg']}>
        <Image width={180} height={181} src={homieLeft} alt="Homie" />
      </div>
    </div>
  )
}
