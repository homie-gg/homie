import { dbClient } from '@/database/client'
import { Nullable, sql } from 'kysely'

interface GetPullRequestsParams {
  startDate: Date
  endDate: Date
  organizationId: number
  contributorId: number
}

export interface LatestPullRequest {
  id: number
  created_at: Date
  merged_at: Date | null
  closed_at: Date | null
  title: string
  contributor_id: number
}

export async function getContributorLatestPullRequest(
  params: GetPullRequestsParams,
): Promise<LatestPullRequest | null> {
  const { organizationId, contributorId } = params

  const latestPullRequest = await dbClient
    .selectFrom('homie.pull_request')
    .where('homie.pull_request.organization_id', '=', organizationId)
    .where('homie.pull_request.contributor_id', '=', contributorId)
    .where((eb) =>
      eb('homie.pull_request.was_merged_to_default_branch', '=', true).or(
        'homie.pull_request.target_branch',
        'is',
        null,
      ),
    )
    .orderBy('homie.pull_request.created_at', 'desc')
    .limit(1)
    .select([
      'homie.pull_request.id',
      'homie.pull_request.created_at',
      'homie.pull_request.merged_at',
      'homie.pull_request.closed_at',
      'homie.pull_request.title',
      'homie.pull_request.contributor_id',
    ])
    .executeTakeFirst()

  return latestPullRequest ?? null
}
