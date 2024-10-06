import { dbClient } from '@/database/client'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { DynamicTool } from '@langchain/core/tools'

interface GetListGitlabProjectsTool {
  answerID: string
  organization: {
    id: number
  }
}

export function getListGitlabProjectsTool(params: GetListGitlabProjectsTool) {
  const { answerID: answerId, organization } = params
  return new DynamicTool({
    name: 'list_gitlab_projects',
    description: 'Returns all Gitlab Projects',
    func: async () => {
      logger.debug('List Gitlab projects', {
        event: 'get_answer:list_gitlab_projects:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
      })

      try {
        const projects = await dbClient
          .selectFrom('gitlab.project')
          .where('organization_id', '=', organization.id)
          .select(['name', 'id'])
          .execute()

        logger.debug('Got repos', {
          event: 'get_answer:list_gitlab_projects:got_projects',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          repos: projects,
        })

        return JSON.stringify(projects)
      } catch (error) {
        logger.debug('Failed getting repos', {
          event: 'get_answer:list_gitlab_projects:failed',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          error: error instanceof Error ? error.message : 'unknown',
        })

        return 'FAILED'
      }
    },
  })
}
