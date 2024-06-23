import { dbClient } from '@/database/client'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { taskStatus } from '@/lib/tasks'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

interface GetFindCompletedTasksToolParams {
  organization: {
    id: number
  }
  answerId: string
}

export function getFindCompletedTasksTool(
  params: GetFindCompletedTasksToolParams,
) {
  const { organization, answerId } = params
  return new DynamicStructuredTool({
    name: 'find_completed_tasks',
    description: 'Find tasks that were completed since the given date',
    schema: z.object({
      date: z.coerce
        .date()
        .describe('The lower bound date of when tasks were completed.'),
    }),
    func: async (params) => {
      logger.debug('Call: Find Completed Tasks', {
        event: 'get_answer:find_completed_tasks:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
      })

      try {
        const tasks = await dbClient
          .selectFrom('homie.task')
          .where('organization_id', '=', organization.id)
          .where('task_status_id', '=', taskStatus.done)
          .where('completed_at', 'is not', null)
          .where('completed_at', '>', params.date)
          .orderBy('completed_at', 'desc')
          .select(['name', 'description', 'html_url'])
          .execute()

        if (tasks.length === 0) {
          logger.debug('No completed tasks found', {
            event: 'get_answer:find_completed_tasks:no_tasks',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
          })

          return 'No tasks have been completed since the given date.'
        }

        logger.debug('Found completed tasks', {
          event: 'get_answer:find_completed_tasks:found',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          tasks,
        })

        return JSON.stringify(tasks)
      } catch (error) {
        logger.debug('Failed to find completed tasks', {
          event: 'get_answer:find_completed_tasks:failed',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          error,
        })

        return 'FAILED'
      }
    },
  })
}
