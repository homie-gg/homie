import { dbClient } from '@/database/client'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

interface getFindContributorTool {
  organization: {
    id: number
    ext_gh_install_id: number | null
  }
  answerID: string
}

export function getFindContributorTool(params: getFindContributorTool) {
  const { organization, answerID: answerId } = params
  return new DynamicStructuredTool({
    name: 'find_contributor',
    description: 'Finds a given contributor.',
    schema: z.object({
      contributor_id: z
        .number()
        .describe('Contributor ID for the contributor to find'),
    }),
    func: async (params) => {
      const { contributor_id } = params

      logger.debug('Call - Find Task', {
        event: 'get_answer:find_contributor:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
        contributor_id,
      })

      try {
        const contributor = await dbClient
          .selectFrom('homie.contributor')
          .where('id', '=', contributor_id)
          .select(['id', 'username', 'ext_slack_member_id'])
          .executeTakeFirst()

        if (!contributor) {
          logger.debug('No contributor found', {
            event: 'get_answer:find_contributor:none_found',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            contributor_id,
          })

          return 'Could not find contributor.'
        }

        logger.debug('Found contributor', {
          event: 'get_answer:find_contributor:call',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          contributor_id,
        })

        return JSON.stringify({
          id: contributor.id,
          username: contributor.username,
          slackUsername: contributor.ext_slack_member_id
            ? `<@${contributor.ext_slack_member_id}>`
            : '',
        })
      } catch (error) {
        return 'FAILED'
      }
    },
  })
}
