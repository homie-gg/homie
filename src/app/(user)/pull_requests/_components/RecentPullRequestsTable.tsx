import ChartCard from '@/app/(user)/pull_requests/_components/ChartCard'
import { PullRequest } from '@/app/(user)/pull_requests/_utils/get-pull-requests'
import DataTable from '@/lib/ui/HomieDataTable'

interface RecentPullRequestsTableProps {
  pullRequests: PullRequest[]
}

export default function RecentPullRequestsTable(
  props: RecentPullRequestsTableProps,
) {
  const { pullRequests } = props

  const rows = pullRequests.map((pullRequest) => [
    pullRequest.title,
    pullRequest.user_username,
  ])

  return (
    <ChartCard title="Recent PRs" className="h-full">
      <DataTable
        data={{
          headings: ['Task', 'Contributor'],
          rows,
        }}
      />
    </ChartCard>
  )
}
