'use client'

import ContributorsTableSingleRow from '@/app/(user)/review/_components/ContributorsTableSingleRow'
import { useContributors } from '@/app/(user)/review/_components/PullRequestsProvider'

export default function ContributorsTableRows() {
  const { contributors } = useContributors()

  const sorted = contributors.sort((a, b) => b.prCount - a.prCount) // Descending
  return (
    <>
      {sorted.map((contributor) => (
        <ContributorsTableSingleRow
          key={contributor.userId}
          userId={contributor.userId}
          prCount={contributor.prCount}
        />
      ))}
    </>
  )
}
