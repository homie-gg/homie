import { GithubPullRequest } from '@/lib/db/types'

export function getNumMergedPRs(pullRequests: GithubPullRequest[]) {
  return pullRequests.filter((pr) => pr.merged_at !== null).length
}
