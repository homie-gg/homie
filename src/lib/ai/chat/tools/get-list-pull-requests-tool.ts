import { dbClient } from '@/database/client'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { endOfDay, startOfDay } from 'date-fns'
import { z } from 'zod'

interface getListPullRequestsToolParams {
  organization: {
    id: number
  }
  answerId: string
}

export function getListPullRequestsTool(params: getListPullRequestsToolParams) {
  const { organization, answerId } = params
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
      targetBranch: z
        .string()
        .describe('Target branch that the PR was merged to')
        .optional(),
    }),
    func: async ({ startDate, endDate, targetBranch }) => {
      logger.debug('Call - List Pull Requests', {
        event: 'get_answer:list_pull_requests:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
        start_date: startDate,
        end_date: endDate,
      })

      try {
        let query = dbClient
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
          query = query.where(
            'created_at',
            '>',
            startOfDay(new Date(startDate)),
          )
        }

        if (endDate) {
          query = query.where('created_at', '<', endOfDay(new Date(endDate)))
        }

        if (targetBranch) {
          query = query.where('target_branch', 'ilike', `%${targetBranch}%`)
        }

        const pullRequests = await query.execute()

        logger.debug('Found PRs', {
          event: 'get_answer:list_pull_requests:got_prs',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          start_date: startDate,
          end_date: endDate,
          pull_requests: pullRequests,
        })

        return pullRequests
          .map(
            (pullRequest) =>
              `Title: ${pullRequest.title} | Description: ${pullRequest.body} | Contributor: ${pullRequest.username} | ${pullRequest.merged_at ? `Merged at ${pullRequest.merged_at}` : 'Not merged'} | URL: ${pullRequest.html_url}`,
          )
          .join('\n')
      } catch (error) {
        logger.debug('Failed to list PRs', {
          event: 'get_answer:list_pull_requests:failed',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          start_date: startDate,
          end_date: endDate,
          error,
        })

        return 'FAILED'
      }
    },
  })
}
