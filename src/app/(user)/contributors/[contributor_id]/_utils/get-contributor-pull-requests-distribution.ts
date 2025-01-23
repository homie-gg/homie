import { dbClient } from '@/database/client'

interface GetContributorPullRequestsDistributionParams {
  contributor: {
    id: number
  }
  organization: {
    id: number
  }
  startDate: Date
  endDate: Date
}

export async function getContributorPullRequestsDistribution(
  params: GetContributorPullRequestsDistributionParams,
) {
  const { contributor, organization, startDate, endDate } = params

  const pullRequests = await dbClient
    .selectFrom('homie.pull_request')
    .where('contributor_id', '=', contributor.id)
    .where('created_at', '>=', startDate)
    .where('created_at', '<=', endDate)
    .where('organization_id', '=', organization.id)
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
      'github.repo.name as github_repo_name',
      'gitlab.project.name as gitlab_project_name',
    ])
    .execute()

  const repoCounts: Record<string, number> = {}
  for (const pullRequest of pullRequests) {
    const repo = pullRequest.github_repo_name ?? pullRequest.gitlab_project_name
    if (!repo) {
      continue
    }

    const existingCount = repoCounts[repo] ?? 0
    repoCounts[repo] = existingCount + 1
  }

  const data = Object.entries(repoCounts).map(([repo, count]) => ({
    label: repo,
    count,
  }))

  return data
}
