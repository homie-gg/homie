'use client'

import {
  useContributors,
  usePullRequests,
} from '@/app/(user)/review/_components/PullRequestsProvider'

export default function PercentTopContribution() {
  const { pullRequests } = usePullRequests()
  const { topContributors } = useContributors()

  const numTopPullRequests = pullRequests.filter((pr) =>
    topContributors.some((c) => c.userId === String(pr.user_id)),
  ).length

  const percentContribution = Math.round(
    100 * (numTopPullRequests / pullRequests.length),
  )

  return percentContribution
}
