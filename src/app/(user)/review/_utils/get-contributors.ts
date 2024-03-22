import { PullRequest } from '@/app/(user)/review/_utils/get-pull-requests'

export type Contributor = {
  id: number
  username: string
  prCount: number
}

export function getContributors(pullRequests: PullRequest[]): Contributor[] {
  const contributors: Record<string, Contributor> = {}

  for (const pullRequest of pullRequests) {
    const current = contributors[pullRequest.user_id] ?? {
      id: pullRequest.user_id,
      username: pullRequest.username,
      prCount: 0,
    }
    contributors[pullRequest.user_id] = {
      ...current,
      prCount: current.prCount + 1,
    }
  }

  return Object.values(contributors).sort(
    ({ prCount: aCount }, { prCount: bCount }) => bCount - aCount, // descendign
  )
}
