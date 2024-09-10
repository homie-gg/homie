import styles from './ConnectRepoStep.module.scss'
import Image from 'next/image'
import { Button } from '@/lib/ui/HomieButton'
import GithubIcon from '@/app/onboarding/_components/GithubIcon'
import GitlabIcon from '@/app/onboarding/_components/GitlabIcon'
import homieLeft from './homie-left.svg'

export default function ConnectRepoStep() {
  return (
    <div className={styles['container']}>
      <div className={styles['content']}>
        <h1 className={styles['heading']}>Now let’s link your repository</h1>
        <div className={styles['action']}>
          <Button
            variant="outline"
            className={styles.button}
            onClick={() => {}}
          >
            <span>
              <GithubIcon />
            </span>
            <span>Connect Github</span>
          </Button>
          <span>or</span>
          <Button
            variant="outline"
            className={styles.button}
            onClick={() => {}}
          >
            <span>
              <GitlabIcon />
            </span>
            <span>Connect Gitlab</span>
          </Button>
        </div>
      </div>

      <div className={styles['container-bg']}>
        <Image width={180} height={181} src={homieLeft} alt="Homie" />
      </div>
    </div>
  )
}
