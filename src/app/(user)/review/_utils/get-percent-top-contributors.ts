import { getTopContributors } from '@/app/(user)/review/_utils/get-top-contributors'
import { GithubPullRequest } from '@/lib/db/types'

export async function getPercentTopContributors(
  pullRequests: GithubPullRequest[],
) {
  const topContributors = await getTopContributors(pullRequests)

  if (pullRequests.length === 0) {
    return 100
  }

  const numTopPullRequests = pullRequests.filter((pr) =>
    topContributors.some((c) => c.id === pr.user_id),
  ).length

  const percentContribution = Math.round(
    100 * (numTopPullRequests / pullRequests.length),
  )

  return percentContribution
}
