import { PullRequest } from '@/app/(user)/pull_requests/_utils/get-pull-requests'

export function getNumPendingPRs(pullRequests: PullRequest[]) {
  return pullRequests.filter(
    (pr) => pr.merged_at === null && pr.closed_at === null,
  ).length
}
