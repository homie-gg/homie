import { PullRequest } from '@/app/(user)/review/_utils/get-pull-requests'
import { getTopContributors } from '@/app/(user)/review/_utils/get-top-contributors'

export function getPercentTopContributors(pullRequests: PullRequest[]) {
  const topContributors = getTopContributors(pullRequests)

  if (pullRequests.length === 0) {
    return 100
  }

  const numTopPullRequests = pullRequests.filter((pr) =>
    topContributors.some((c) => c.id === pr.contributor_id),
  ).length

  const percentContribution = Math.round(
    100 * (numTopPullRequests / pullRequests.length),
  )

  return percentContribution
}
