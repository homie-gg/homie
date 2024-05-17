import { dbClient } from '@/database/client'
import { DynamicTool } from '@langchain/core/tools'

interface getListPullRequestsToolParams {
  organization: {
    id: number
  }
}

export function getListPullRequestsTool(params: getListPullRequestsToolParams) {
  const { organization } = params
  return new DynamicTool({
    name: 'list_pull_requests',
    description: 'List pull requests',
    func: async () => {
      const pullRequests = await dbClient
        .selectFrom('homie.pull_request')
        .where('homie.pull_request.organization_id', '=', organization.id)
        .innerJoin(
          'homie.contributor',
          'homie.contributor.id',
          'homie.pull_request.contributor_id',
        )
        .orderBy('homie.pull_request.created_at desc')
        .select([
          'title',
          'homie.contributor.username',
          'merged_at',
          'html_url',
        ])
        .execute()

      return pullRequests
        .map(
          (pullRequest) =>
            `Title: ${pullRequest.title} | Contributor: ${pullRequest.username} | ${pullRequest.merged_at ? `Merged at ${pullRequest.merged_at}` : 'Not merged'} | URL: ${pullRequest.html_url}`,
        )
        .join('\n')
    },
  })
}
