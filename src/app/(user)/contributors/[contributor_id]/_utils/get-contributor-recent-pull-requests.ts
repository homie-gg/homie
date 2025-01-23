import { dbClient } from '@/database/client'

interface GetContributorRecentPullRequestsParams {
  startDate: Date
  endDate: Date
  organization: {
    id: number
  }
  contributor: {
    id: number
  }
}

export type GetContributorRecentPullRequestsData = Array<{
  id: number
  created_at: Date
  title: string
}>

export async function getContributorRecentPullRequests(
  params: GetContributorRecentPullRequestsParams,
): Promise<GetContributorRecentPullRequestsData> {
  const { organization, startDate, endDate, contributor } = params

  return dbClient
    .selectFrom('homie.pull_request')
    .where('homie.pull_request.organization_id', '=', organization.id)
    .where('homie.pull_request.contributor_id', '=', contributor.id)
    .where('homie.pull_request.created_at', '>=', startDate)
    .where('homie.pull_request.created_at', '<=', endDate)
    .orderBy('homie.pull_request.created_at', 'desc')
    .select(['id', 'created_at', 'title'])
    .execute()
}
