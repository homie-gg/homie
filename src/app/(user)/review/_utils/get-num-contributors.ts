import { getContributors } from '@/app/(user)/review/_utils/get-contributors'
import { GithubPullRequest } from '@/lib/db/types'

export async function getNumContributors(pullRequests: GithubPullRequest[]) {
  return Object.keys(await getContributors(pullRequests)).length
}
