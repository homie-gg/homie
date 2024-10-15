import ChartCard from '@/app/(user)/pull_requests/_components/ChartCard'
import { PullRequest } from '@/app/(user)/pull_requests/_utils/get-pull-requests'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/lib/ui/HomieTable'

interface RecentPullRequestsTableProps {
  pullRequests: PullRequest[]
}

const maxNumItems = 5

export default function RecentPullRequestsTable(
  props: RecentPullRequestsTableProps,
) {
  const { pullRequests } = props

  const recentPullRequests = pullRequests.filter(
    (_pullRequest, index) => index < maxNumItems,
  )

  return (
    <ChartCard title="Recent PRs" className="h-full">
      <Table>
        <TableHeader>
          <TableRow>
            <TableCell>Task</TableCell>
            <TableCell>Contributor</TableCell>
          </TableRow>
        </TableHeader>
        <TableBody>
          {recentPullRequests.map((pullRequest) => (
            <TableRow key={pullRequest.id}>
              <TableCell>{pullRequest.title}</TableCell>
              <TableCell>{pullRequest.user_username}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </ChartCard>
  )
}
