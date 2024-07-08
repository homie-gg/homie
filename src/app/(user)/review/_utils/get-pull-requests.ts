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

  return (
    dbClient
      .selectFrom('homie.pull_request')
      .where('homie.pull_request.created_at', '>=', startDate)
      .where('homie.pull_request.created_at', '<=', endDate)
      .where('homie.pull_request.organization_id', '=', organization.id)
      // Only send PRs merged to default branch
      .where((eb) =>
        eb('was_merged_to_default_branch', '=', true)
          // Assume no target_branch (legacy) to be default branch, which were the only PRs saved.
          .or('target_branch', 'is', null),
      )
      .innerJoin(
        'homie.contributor',
        'homie.contributor.id',
        'homie.pull_request.contributor_id',
      )
      .leftJoin(
        'github.repo',
        'github.repo.id',
        'homie.pull_request.github_repo_id',
      )
      .leftJoin(
        'gitlab.project',
        'gitlab.project.id',
        'homie.pull_request.gitlab_project_id',
      )
      .select([
        'homie.pull_request.id',
        'homie.pull_request.created_at',
        'homie.pull_request.merged_at',
        'homie.pull_request.closed_at',
        'homie.contributor.username as user_username',
        'homie.pull_request.title',
        'homie.pull_request.contributor_id',
        'github.repo.name as github_repo_name',
        'gitlab.project.name as gitlab_project_name',
      ])
      .execute()
  )
}
