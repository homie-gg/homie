import { PullRequest } from '@/app/(user)/pull_requests/_utils/get-pull-requests'

export type Contributor = {
  id: number
  username: string
  prCount: number
}

export function getContributors(pullRequests: PullRequest[]): Contributor[] {
  const contributors: Record<string, Contributor> = {}

  for (const pullRequest of pullRequests) {
    const current = contributors[pullRequest.contributor_id] ?? {
      id: pullRequest.contributor_id,
      username: pullRequest.user_username,
      prCount: 0,
    }
    contributors[pullRequest.contributor_id] = {
      ...current,
      prCount: current.prCount + 1,
    }
  }

  return Object.values(contributors).sort(
    ({ prCount: aCount }, { prCount: bCount }) => bCount - aCount, // descendign
  )
}
