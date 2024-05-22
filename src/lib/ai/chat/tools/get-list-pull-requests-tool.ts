import { dbClient } from '@/database/client'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { endOfDay, startOfDay } from 'date-fns'
import { z } from 'zod'

interface getListPullRequestsToolParams {
  organization: {
    id: number
  }
}

export function getListPullRequestsTool(params: getListPullRequestsToolParams) {
  const { organization } = params
  return new DynamicStructuredTool({
    name: 'list_pull_requests',
    description: 'List pull requests',
    schema: z.object({
      startDate: z.coerce
        .date()
        .describe('The lower bound date of pull requests')
        .optional(),
      endDate: z.coerce
        .date()
        .describe('The upper bound date of pull requests')
        .optional(),
    }),
    func: async ({ startDate, endDate }) => {
      const query = dbClient
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
          'body',
          'homie.contributor.username',
          'merged_at',
          'html_url',
        ])

      if (startDate) {
        query.where('created_at', '>', startOfDay(new Date(startDate)))
      }

      if (endDate) {
        query.where('created_at', '<', endOfDay(new Date(endDate)))
      }

      const pullRequests = await query.execute()

      return pullRequests
        .map(
          (pullRequest) =>
            `Title: ${pullRequest.title} | Description: ${pullRequest.body} | Contributor: ${pullRequest.username} | ${pullRequest.merged_at ? `Merged at ${pullRequest.merged_at}` : 'Not merged'} | URL: ${pullRequest.html_url}`,
        )
        .join('\n')
    },
  })
}
