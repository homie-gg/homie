import { TabsContent, TabsList, TabsTrigger } from '@/lib/ui/Tabs'
import { endOfDay, endOfWeek, parse, startOfDay, startOfWeek } from 'date-fns'
import OverviewsTab from '@/app/(user)/dashboard/_components/OverviewsTab'
import { getUserOrganization } from '@/lib/auth/get-user-organization'
import DatePicker from '@/app/(user)/dashboard/_components/DatePicker'
import ContributorsTable from '@/app/(user)/dashboard/_components/ContributorsTable'
import DashboardTabs from '@/app/(user)/dashboard/_components/DashboardTabs'
import PullRequestsTable from '@/app/(user)/dashboard/_components/PullRequestsTable'
import { getPullRequests } from '@/app/(user)/dashboard/_utils/get-pull-requests'
import SetupCompleteConfetti from '@/app/(user)/dashboard/_components/SetupCompleteConfetti'
import styles from './_components/DashboardPage.module.scss'

interface ReviewPageProps {
  searchParams: {
    from?: string
    to?: string
    tab?: string
    confetti?: string
  }
}

export default async function DashboardPage(props: ReviewPageProps) {
  const { searchParams = {} } = props

  const startDate = searchParams.from
    ? parse(searchParams.from, 'yyyy-MM-dd', new Date())
    : startOfWeek(new Date(), { weekStartsOn: 1 }) // Mon start

  const endDate = searchParams.to
    ? parse(searchParams.to, 'yyyy-MM-dd', new Date())
    : endOfWeek(startDate, { weekStartsOn: 1 })

  const organization = await getUserOrganization()
  if (!organization) {
    return
  }

  const pullRequests = await getPullRequests({
    startDate: startOfDay(startDate),
    endDate: endOfDay(endDate),
    organization,
  })

  const tab = searchParams.tab ?? 'overview'

  return (
    <div className={styles.main}>
      <SetupCompleteConfetti />
      <div className="flex items-center justify-between space-y-2">
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
      </DashboardTabs>
    </div>
  )
}
