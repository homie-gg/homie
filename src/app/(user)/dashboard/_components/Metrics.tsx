import MetricsCard from '@/app/(user)/dashboard/_components/MetricsCard'
import styles from './Metrics.module.scss'
import LightningIcon from '@/app/(user)/dashboard/_components/LightningIcon'
import RocketIcon from '@/app/(user)/dashboard/_components/RocketIcon'
import ActivityIcon from '@/app/(user)/dashboard/_components/ActivityIcon'
import { User } from 'lucide-react'

interface MetricsProps {}

export default function Metrics(props: MetricsProps) {
  const {} = props
  return (
    <div className={styles.root}>
      <MetricsCard
        color="amber"
        label="Opened PRs"
        body="6"
        icon={<LightningIcon />}
      />
      <MetricsCard
        color="green"
        label="Merged PRs"
        body="25"
        icon={<RocketIcon />}
      />
      <MetricsCard
        color="orchid"
        label="Pending PRs"
        body="3"
        icon={<ActivityIcon />}
      />
      <MetricsCard
        color="violet"
        label="Contributors"
        body="3"
        icon={<User />}
      />
    </div>
  )
}
