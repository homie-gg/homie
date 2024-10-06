import { searchGeneralContext } from '@/lib/ai/search-general-context'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { DynamicTool } from '@langchain/core/tools'

interface getSearchGeneralContextToolParams {
  organization: {
    id: number
  }
  answerId: string
}

export function getSearchGeneralContextTool(
  params: getSearchGeneralContextToolParams,
) {
  const { organization, answerId } = params
  return new DynamicTool({
    name: 'search_general_context',
    description:
      'Search the general context for potential answers as a fallback if other search did not return results.',
    func: async (question: string) => {
      logger.debug('Call: Search General Context', {
        event: 'get_answer:search_general_context:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
        question,
      })

      try {
        const answer = await searchGeneralContext({
          organization,
          question,
        })

        logger.debug('Found answer', {
          event: 'get_answer:search_general_context:got_answer',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          question,
          answer,
        })

        return answer
      } catch (error) {
        logger.debug('Failed to search general context', {
          event: 'get_answer:search_general_context:failed',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          question,
          error,
        })

        return 'FAILED'
      }
    },
  })
}
