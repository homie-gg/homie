import { GithubPullRequest } from '@/lib/db/types'

export function getNumPendingPRs(pullRequests: GithubPullRequest[]) {
  return pullRequests.filter(
    (pr) => pr.merged_at === null && pr.closed_at === null,
  ).length
}
