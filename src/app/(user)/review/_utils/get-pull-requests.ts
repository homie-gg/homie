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
  github_repo_name: string | null
  gitlab_project_name: string | null
}

export async function getPullRequests(
  params: GetPullRequestsParams,
): Promise<PullRequest[]> {
  const { startDate, endDate, organization } = params

  return dbClient
    .selectFrom('voidpm.pull_request')
    .where('voidpm.pull_request.created_at', '>=', startDate)
    .where('voidpm.pull_request.created_at', '<=', endDate)
    .where('voidpm.pull_request.organization_id', '=', organization.id)
    .innerJoin(
      'voidpm.contributor',
      'voidpm.contributor.id',
      'voidpm.pull_request.contributor_id',
    )
    .leftJoin(
      'github.repo',
      'github.repo.id',
      'voidpm.pull_request.github_repo_id',
    )
    .leftJoin(
      'gitlab.project',
      'gitlab.project.id',
      'voidpm.pull_request.gitlab_project_id',
    )
    .select([
      'voidpm.pull_request.id',
      'voidpm.pull_request.created_at',
      'voidpm.pull_request.merged_at',
      'voidpm.pull_request.closed_at',
      'voidpm.contributor.username as user_username',
      'voidpm.pull_request.title',
      'voidpm.pull_request.contributor_id',
      'github.repo.name as github_repo_name',
      'gitlab.project.name as gitlab_project_name',
    ])
    .execute()
}
