import { getContributors } from '@/app/(user)/review/_utils/get-contributors'
import { GithubPullRequest } from '@/lib/db/types'

export function getNumContributors(pullRequests: GithubPullRequest[]) {
  return Object.keys(getContributors(pullRequests)).length
}
