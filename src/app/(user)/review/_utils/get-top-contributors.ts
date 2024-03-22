import { getContributors } from '@/app/(user)/review/_utils/get-contributors'
import { GithubPullRequest } from '@/lib/db/types'

const numTopContributors = 5

export async function getTopContributors(pullRequests: GithubPullRequest[]) {
  const contributors = await getContributors(pullRequests)

  return contributors.filter((_c, index) => index < numTopContributors)
}
