import { dbClient } from '@/database/client'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { DynamicTool } from '@langchain/core/tools'

interface GetListAsanaProjectsTool {
  answerID: string
  organization: {
    id: number
  }
}

export function getListAsanaProjectsTool(params: GetListAsanaProjectsTool) {
  const { answerID: answerId, organization } = params
  return new DynamicTool({
    name: 'list_asana_projects',
    description: 'Returns all Asana projects',
    func: async () => {
      logger.debug('Call: List Asana Projects', {
        event: 'get_answer:list_asana_projects:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
      })

      try {
        const projects = await dbClient
          .selectFrom('asana.project')
          .where('organization_id', '=', organization.id)
          .select(['name', 'id'])
          .where('enabled', '=', true)
          .execute()

        logger.debug('Got projects', {
          event: 'get_answer:list_asana_projects:got_projects',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          projects,
        })

        return JSON.stringify(projects)
      } catch (error) {
        logger.debug('Failed getting projects', {
          event: 'get_answer:list_asana_projects:failed',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          error: error instanceof Error ? error.message : 'unknown',
        })

        return 'FAILED'
      }
    },
  })
}
