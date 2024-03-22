import { PullRequest } from '@/app/(user)/review/_utils/get-pull-requests'
import { getTopContributors } from '@/app/(user)/review/_utils/get-top-contributors'

interface TopContributorsListProps {
  pullRequests: PullRequest[]
}

export async function TopContributorsList(props: TopContributorsListProps) {
  const { pullRequests } = props
  const topContributors = getTopContributors(pullRequests)

  return (
    <div className="space-y-4">
      {topContributors.map((contributor) => (
        <div
          className="flex items-center justify-between"
          key={contributor.username}
        >
          <p className="text-sm font-medium leading-none">
            {contributor.username}
          </p>
          <p className="text-sm text-muted-foreground">{contributor.prCount}</p>
        </div>
      ))}
    </div>
  )
}
