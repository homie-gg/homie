import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { DynamicTool } from '@langchain/core/tools'

interface GetTodaysDateToolParams {
  answerId: string
  organization: {
    id: number
  }
}

export function getTodaysDateTool(params: GetTodaysDateToolParams) {
  const { answerId, organization } = params
  return new DynamicTool({
    name: 'get_todays_date',
    description: "Get today's date",
    func: async () => {
      logger.debug('Call: Get Todays Date', {
        event: 'get_answer:get_todays_date:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
      })
      return new Date().toISOString()
    },
  })
}
