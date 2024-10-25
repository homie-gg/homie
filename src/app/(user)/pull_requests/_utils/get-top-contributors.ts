import {
  Contributor,
  getContributors,
} from '@/app/(user)/pull_requests/_utils/get-contributors'
import { PullRequest } from '@/app/(user)/pull_requests/_utils/get-pull-requests'

export const numTopContributors = 5

export function getTopContributors(pullRequests: PullRequest[]): Contributor[] {
  const contributors = getContributors(pullRequests)

  return contributors.filter((_c, index) => index < numTopContributors)
}
