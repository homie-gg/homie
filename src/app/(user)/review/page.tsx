import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/lib/ui/Tabs'
import { CalendarDateRangePicker } from '@/lib/ui/DateRangePicker'
import {
  addDays,
  endOfDay,
  endOfWeek,
  startOfDay,
  startOfWeek,
  subDays,
} from 'date-fns'
import PullRequestsProvider from '@/app/(user)/review/_components/PullRequestsProvider'
import { dbClient } from '@/lib/db/client'
import OverviewsTab from '@/app/(user)/review/_components/OverviewsTab'
import ContributorsTab from '@/app/(user)/review/_components/ContributorsTab'

export default async function ReviewPage() {
  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 }) // Mon start
  const endDate = endOfWeek(startDate, { weekStartsOn: 1 })

  const pullRequests = await dbClient
    .selectFrom('github.pull_request')
    .where('created_at', '>=', startDate)
    .where('created_at', '<=', endDate)
    .selectAll()
    .execute()

  return (
    <PullRequestsProvider
      from={startDate}
      to={endDate}
      initialValue={pullRequests.map((pullRequest) => ({
        ...pullRequest,
        created_at: pullRequest.created_at.toISOString(),
        merged_at: pullRequest.merged_at?.toISOString() ?? null,
        closed_at: pullRequest.closed_at?.toISOString() ?? null,
      }))}
    >
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Review</h2>
        <div className="flex items-center space-x-2">
          <CalendarDateRangePicker />
        </div>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contributors">Contributors</TabsTrigger>
          <TabsTrigger value="pull_requests">Pull Requests</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          <OverviewsTab />
        </TabsContent>
        <TabsContent value="contributors" className="space-y-4">
          <ContributorsTab />
        </TabsContent>
      </Tabs>
    </PullRequestsProvider>
  )
}
