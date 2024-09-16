import { getContributors } from '@/app/(user)/pull_requests/_utils/get-contributors'
import { PullRequest } from '@/app/(user)/pull_requests/_utils/get-pull-requests'

export function getNumContributors(pullRequests: PullRequest[]) {
  return Object.keys(getContributors(pullRequests)).length
}
