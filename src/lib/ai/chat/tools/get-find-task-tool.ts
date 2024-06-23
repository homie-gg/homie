import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { findTask } from '@/lib/tasks/find-task'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

interface GetFindTaskTool {
  organization: {
    id: number
    ext_gh_install_id: number | null
  }
  answerId: string
}

export function getFindTaskTool(params: GetFindTaskTool) {
  const { organization, answerId } = params
  return new DynamicStructuredTool({
    name: 'find_task',
    description: 'Finds a given task.',
    schema: z.object({
      name: z.string().describe('Name of the task').optional(),
      task_id: z.number().describe('Task ID for the task to find.').optional(),
    }),
    func: async (params) => {
      const { task_id, name } = params

      logger.debug('Call - Find Task', {
        event: 'get_answer:find_task:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
        name,
        task_id,
      })

      try {
        const task = await findTask({
          organization_id: organization.id,
          id: task_id,
          name,
        })

        if (!task) {
          logger.debug('No task found', {
            event: 'get_answer:find_task:none_found',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
            name,
            task_id,
          })

          return 'Could not find task.'
        }

        logger.debug('Found task', {
          event: 'get_answer:find_task:call',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          name,
          task_id,
          task,
        })

        return JSON.stringify(task)
      } catch (error) {
        return 'FAILED'
      }
    },
  })
}
