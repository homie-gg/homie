import { dbClient } from '@/database/client'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { zodFunction } from 'openai/helpers/zod.mjs'
import { z } from 'zod'

interface GetListAsanaProjectsTool {
  answerId: string
  organization: {
    id: number
  }
}

export function getListAsanaProjectsTool(params: GetListAsanaProjectsTool) {
  const { answerId, organization } = params
  return zodFunction({
    name: 'list_asana_projects',
    description: 'Returns all Asana projects',
    parameters: z.object({}),
    function: async () => {
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
