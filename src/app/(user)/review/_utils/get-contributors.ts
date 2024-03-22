import { dbClient } from '@/lib/db/client'
import { GithubPullRequest, GithubUser } from '@/lib/db/types'

export type Contributor = GithubUser & {
  prCount: number
}

export async function getContributors(
  pullRequests: GithubPullRequest[],
): Promise<Contributor[]> {
  const contributors: Record<string, number> = {}

  for (const pullRequest of pullRequests) {
    const currentCount = contributors[pullRequest.user_id] ?? 0
    contributors[pullRequest.user_id] = currentCount + 1
  }

  const sorted = Object.entries(contributors)
    .map(([id, prCount]) => ({
      userId: parseInt(id),
      prCount,
    }))
    .sort((a, b) => b.prCount - a.prCount) // ascending

  return Promise.all(
    sorted.map(async ({ userId, prCount }) => {
      const user = await dbClient
        .selectFrom('github.user')
        .where('id', '=', userId)
        .selectAll()
        .executeTakeFirstOrThrow()
      return {
        ...user,
        prCount,
      }
    }),
  )
}
