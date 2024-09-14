import { TabsContent, TabsList, TabsTrigger } from '@/lib/ui/Tabs'
import {
  endOfDay,
  endOfWeek,
  parse,
  startOfDay,
  startOfWeek,
  subDays,
} from 'date-fns'
import { getUserOrganization } from '@/lib/auth/get-user-organization'
import { getPullRequests } from '@/app/(user)/dashboard/_utils/get-pull-requests'
import SetupCompleteConfetti from '@/app/(user)/dashboard/_components/SetupCompleteConfetti'
import styles from './_components/DashboardPage.module.scss'
import clsx from 'clsx'
import PageHeader from '@/app/(user)/_components/PageHeader'
import PageTitle from '@/app/(user)/_components/PageTitle'
import DateSelect from '@/app/(user)/dashboard/_components/DateSelect'
import Metrics from '@/app/(user)/dashboard/_components/Metrics'
import PullRequestsChart from '@/app/(user)/dashboard/_components/PullRequestsChart'
import { Days, daysFilter } from '@/app/(user)/dashboard/_components/dates'

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
          <PullRequestsChart
            pullRequests={pullRequests}
            startDate={startDate}
            endDate={endDate}
          />
        </div>
      </div>
      {/* <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Review</h2>
        <div className="flex items-center space-x-2">
          <DatePicker from={startDate} to={endDate} tab={tab} />
        </div>
      </div>
      <DashboardTabs
        value={tab}
        className="space-y-4"
        startDate={startDate}
        endDate={endDate}
      >
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contributors">Contributors</TabsTrigger>
          <TabsTrigger value="pull_requests">Pull Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <OverviewsTab
            pullRequests={pullRequests}
            startDate={startDate}
            endDate={endDate}
          />
        </TabsContent>
        <TabsContent value="contributors" className="space-y-4">
          <ContributorsTable pullRequests={pullRequests} />
        </TabsContent>
        <TabsContent value="pull_requests" className="space-y-4">
          <PullRequestsTable pullRequests={pullRequests} />
        </TabsContent>
      </DashboardTabs> */}
    </div>
  )
}
