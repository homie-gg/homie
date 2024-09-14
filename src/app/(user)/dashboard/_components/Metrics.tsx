import MetricsCard from '@/app/(user)/dashboard/_components/MetricsCard'
import styles from './Metrics.module.scss'
import LightningIcon from '@/app/(user)/dashboard/_components/LightningIcon'
import RocketIcon from '@/app/(user)/dashboard/_components/RocketIcon'
import ActivityIcon from '@/app/(user)/dashboard/_components/ActivityIcon'
import { User } from 'lucide-react'
import { PullRequest } from '@/app/(user)/dashboard/_utils/get-pull-requests'
import { getNumMergedPRs } from '@/app/(user)/dashboard/_utils/get-num-merged-prs'
import { getNumPendingPRs } from '@/app/(user)/dashboard/_utils/get-num-pending-prs'
import { getNumContributors } from '@/app/(user)/dashboard/_utils/get-num-contributors'

interface MetricsProps {
  pullRequests: PullRequest[]
}

export default function Metrics(props: MetricsProps) {
  const { pullRequests } = props
  return (
    <div className={styles.root}>
      <MetricsCard
        color="amber"
        label="Opened PRs"
        value={pullRequests.length}
        icon={<LightningIcon />}
      />
      <MetricsCard
        color="green"
        label="Merged PRs"
        value={getNumMergedPRs(pullRequests)}
        icon={<RocketIcon />}
      />
      <MetricsCard
        color="orchid"
        label="Pending PRs"
        value={getNumPendingPRs(pullRequests)}
        icon={<ActivityIcon />}
      />
      <MetricsCard
        color="violet"
        label="Contributors"
        value={getNumContributors(pullRequests)}
        icon={<User />}
      />
    </div>
  )
}
