import { dbClient } from '@/database/client'
import { Organization } from '@/database/types'

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
  title: string
  user_username: string
  contributor_id: number
  repo_name: string
}

export async function getPullRequests(
  params: GetPullRequestsParams,
): Promise<PullRequest[]> {
  const { startDate, endDate, organization } = params

  return dbClient
    .selectFrom('github.pull_request')
    .where('github.pull_request.created_at', '>=', startDate)
    .where('github.pull_request.created_at', '<=', endDate)
    .where('github.pull_request.organization_id', '=', organization.id)
    .innerJoin(
      'voidpm.contributor',
      'voidpm.contributor.id',
      'github.pull_request.contributor_id',
    )
    .innerJoin('github.repo', 'github.repo.id', 'github.pull_request.repo_id')
    .select([
      'github.pull_request.id',
      'github.pull_request.created_at',
      'github.pull_request.merged_at',
      'github.pull_request.closed_at',
      'voidpm.contributor.username as user_username',
      'github.pull_request.title',
      'github.pull_request.contributor_id',
      'github.repo.name as repo_name',
    ])
    .execute()
}
