import { getContributors } from '@/app/(user)/dashboard/_utils/get-contributors'
import { PullRequest } from '@/app/(user)/dashboard/_utils/get-pull-requests'

export function getNumContributors(pullRequests: PullRequest[]) {
  return Object.keys(getContributors(pullRequests)).length
}
