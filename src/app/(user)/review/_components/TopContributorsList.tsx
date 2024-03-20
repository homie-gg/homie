'use client'

import GithubUsername from '@/app/(user)/review/_components/GithubUserName'
import { useContributors } from '@/app/(user)/review/_components/PullRequestsProvider'

export function TopContributorsList() {
  const { topContributors } = useContributors()

  return (
    <div className="space-y-4">
      {topContributors.map((contributor) => (
        <div
          className="flex items-center justify-between"
          key={contributor.userId}
        >
          <p className="text-sm font-medium leading-none">
            <GithubUsername userId={contributor.userId} />
          </p>
          <p className="text-sm text-muted-foreground">{contributor.prCount}</p>
        </div>
      ))}
    </div>
  )
}
