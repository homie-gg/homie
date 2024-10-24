import { endOfDay, startOfDay, subDays } from 'date-fns'
import { getUserOrganization } from '@/lib/auth/get-user-organization'
import { getPullRequests } from '@/app/(user)/pull_requests/_utils/get-pull-requests'
import SetupCompleteConfetti from '@/app/(user)/pull_requests/_components/SetupCompleteConfetti'
import styles from './_components/PullRequestsPage.module.scss'
import clsx from 'clsx'
import PageHeader from '@/app/(user)/_components/PageHeader'
import PageTitle from '@/app/(user)/_components/PageTitle'
import DateSelect from '@/app/(user)/_components/DateSelect'
import Metrics from '@/app/(user)/pull_requests/_components/Metrics'
import { Days, daysFilter } from '@/app/(user)/_utils/dates'
import PullRequestsCountsChart from '@/app/(user)/pull_requests/_components/PullRequestsCountsChart'
import PullRequestsDistributionsChart from '@/app/(user)/pull_requests/_components/PullRequestsDistributionChart'
import RecentPullRequestsTable from '@/app/(user)/pull_requests/_components/RecentPullRequestsTable'

interface PullRequestsPageProps {
  searchParams: {
    days?: Days
    confetti?: string
  }
}

export default async function PullRequestsPage(props: PullRequestsPageProps) {
  const { searchParams } = props

  const days =
    searchParams.days && daysFilter.includes(searchParams.days)
      ? searchParams.days
      : '7'

  const startDate = subDays(new Date(), parseInt(days))
  const endDate = endOfDay(new Date())

  const organization = await getUserOrganization()
  if (!organization) {
    return
  }

  const pullRequests = await getPullRequests({
    startDate: startOfDay(startDate),
    endDate: endOfDay(endDate),
    organization,
  })

  return (
    <div className={styles.root}>
      <SetupCompleteConfetti />
      <div className={clsx('container', styles.content)}>
        <PageHeader>
          <PageTitle>Pull Requests</PageTitle>
          <DateSelect slug="pull_requests" days={days} />
        </PageHeader>
        <div className={styles.body}>
          <Metrics pullRequests={pullRequests} />
          <PullRequestsCountsChart
            pullRequests={pullRequests}
            startDate={startDate}
            endDate={endDate}
          />
          <div className="w-full grid lg:flex grid-cols-1 gap-6 py-3">
            <div className="lg:basis-1/2">
              <PullRequestsDistributionsChart pullRequests={pullRequests} />
            </div>
            <div className="lg:basis-1/2">
              <RecentPullRequestsTable pullRequests={pullRequests} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
