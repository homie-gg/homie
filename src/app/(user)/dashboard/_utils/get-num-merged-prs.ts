import { PullRequest } from '@/app/(user)/dashboard/_utils/get-pull-requests'

export function getNumMergedPRs(pullRequests: PullRequest[]) {
  return pullRequests.filter((pr) => pr.merged_at !== null).length
}
