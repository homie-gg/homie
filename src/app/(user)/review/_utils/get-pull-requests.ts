import { dbClient } from '@/lib/db/client'
import { Organization } from '@/lib/db/types'

interface GetPullRequestsParams {
  startDate: Date
  endDate: Date
  organization: Organization
}

export interface PullRequest {
  id: number
  created_at: Date
  merged_at: Date | null
  closed_at: Date | null
  username: string
  title: string
  user_id: number
}

export async function getPullRequests(
  params: GetPullRequestsParams,
): Promise<PullRequest[]> {
  const { startDate, endDate, organization } = params

  return await dbClient
    .selectFrom('github.pull_request')
    .where('github.pull_request.created_at', '>=', startDate)
    .where('github.pull_request.created_at', '<=', endDate)
    .where('github.pull_request.organization_id', '=', organization.id)
    .innerJoin('github.user', 'github.user.id', 'github.pull_request.user_id')
    .select([
      'github.pull_request.id',
      'github.pull_request.created_at',
      'github.pull_request.merged_at',
      'github.pull_request.closed_at',
      'github.user.username',
      'github.pull_request.title',
      'github.pull_request.user_id',
    ])
    .execute()
}
