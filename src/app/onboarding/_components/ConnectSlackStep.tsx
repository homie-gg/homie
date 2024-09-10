import styles from './ConnectSlackStep.module.scss'
import Image from 'next/image'
import { Button } from '@/lib/ui/HomieButton'
import SlackIcon from '@/app/onboarding/_components/SlackIcon'
import homieImage from './homie-down.svg'

export default function ConnectSlackStep() {
  return (
    <div className={styles['container']}>
      <div className={styles['content']}>
        <h1 className={styles['heading']}>Now let’s link to your Slack</h1>
        <div className={styles['action']}>
          <Button
            variant="outline"
            className={styles.button}
            onClick={() => {}}
          >
            <span>
              <SlackIcon />
            </span>
            <span>Connect Slack</span>
          </Button>
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
