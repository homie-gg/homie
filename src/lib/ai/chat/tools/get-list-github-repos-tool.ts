import { dbClient } from '@/database/client'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { DynamicTool } from '@langchain/core/tools'

interface GetListGithubReposTool {
  answerId: string
  organization: {
    id: number
  }
}

export function getListGithubReposTool(params: GetListGithubReposTool) {
  const { answerId, organization } = params
  return new DynamicTool({
    name: 'list_github_repos',
    description: 'Returns all GitHub Repositories',
    func: async () => {
      logger.debug('Call: List GitHub Repos', {
        event: 'get_answer:list_github_repos:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
      })

      try {
        const repos = await dbClient
          .selectFrom('github.repo')
          .where('organization_id', '=', organization.id)
          .select(['name', 'id'])
          .execute()

        logger.debug('Got repos', {
          event: 'get_answer:list_github_repos:got_repos',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          repos,
        })

        return JSON.stringify(repos)
      } catch (error) {
        logger.debug('Failed getting repos', {
          event: 'get_answer:list_github_repos:failed',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          error: error instanceof Error ? error.message : 'unknown',
        })

        return 'FAILED'
      }
    },
  })
}
