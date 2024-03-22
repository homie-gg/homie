import { GithubPullRequest } from '@/app/api/github/pull_requests/route'
import { useGithubUser } from '@/lib/api/github/use-github-user'
import { Skeleton } from '@/lib/ui/Skeleton'
import { TableCell, TableRow } from '@/lib/ui/Table'

interface PullRequestsTableSingleRowProps {
  pullRequest: GithubPullRequest
}

export default function PullRequestsTableSingleRow(
  props: PullRequestsTableSingleRowProps,
) {
  const { pullRequest } = props
  const user = useGithubUser({ userId: pullRequest.user_id })

  if (!user.value) {
    return (
      <TableRow>
        <TableCell>
          <Skeleton className="h-[16px] rounded" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-[16px] rounded" />
        </TableCell>
        <TableCell>
          <Skeleton className="h-[16px] rounded" />
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{user.value.username}</TableCell>
      <TableCell>Some Repo</TableCell>
      <TableCell>{pullRequest.title}</TableCell>
    </TableRow>
  )
}
