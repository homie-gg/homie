'use client'

import { usePullRequests } from '@/app/(user)/review/_components/PullRequestsProvider'
import PullRequestsTableSingleRow from '@/app/(user)/review/_components/PullRequestsTableSingleRow'

export default function PullRequestTableRows() {
  const { pullRequests } = usePullRequests()

  const sorted = pullRequests.sort(
    (a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
  )
  return (
    <>
      {sorted.map((pullRequest) => (
        <PullRequestsTableSingleRow
          key={pullRequest.id}
          pullRequest={pullRequest}
        />
      ))}
    </>
  )
}
