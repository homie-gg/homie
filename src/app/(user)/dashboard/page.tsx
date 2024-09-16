import { TabsContent, TabsList, TabsTrigger } from '@/lib/ui/Tabs'
import { endOfDay, startOfDay, subDays } from 'date-fns'
import { getUserOrganization } from '@/lib/auth/get-user-organization'
import { getPullRequests } from '@/app/(user)/dashboard/_utils/get-pull-requests'
import SetupCompleteConfetti from '@/app/(user)/dashboard/_components/SetupCompleteConfetti'
import styles from './_components/DashboardPage.module.scss'
import clsx from 'clsx'
import PageHeader from '@/app/(user)/_components/PageHeader'
import PageTitle from '@/app/(user)/_components/PageTitle'
import DateSelect from '@/app/(user)/dashboard/_components/DateSelect'
import Metrics from '@/app/(user)/dashboard/_components/Metrics'
import { Days, daysFilter } from '@/app/(user)/dashboard/_components/dates'
import PullRequestsCountsChart from '@/app/(user)/dashboard/_components/PullRequestsCountsChart'
import PullRequestsDistributionsChart from '@/app/(user)/dashboard/_components/PullRequestsDistributionChart'
import RecentPullRequestsTable from '@/app/(user)/dashboard/_components/RecentPullRequestsTable'

interface DashboardPageProps {
  searchParams: {
    days?: Days
    confetti?: string
  }
}

export default async function DashboardPage(props: DashboardPageProps) {
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
          <PageTitle>Dashboard</PageTitle>
          <DateSelect days={days} />
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
