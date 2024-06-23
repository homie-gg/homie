import { dbClient } from '@/database/client'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { taskStatus } from '@/lib/tasks'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

interface GetFindOpenTasksToolParams {
  organization: {
    id: number
  }
  answerId: string
}

export function getFindOpenTasksTool(params: GetFindOpenTasksToolParams) {
  const { organization, answerId } = params
  return new DynamicStructuredTool({
    name: 'find_open_tasks',
    description: 'Find open tasks that are ready to work on',
    schema: z.object({}),
    func: async () => {
      logger.debug('Call - Find Open Tasks', {
        event: 'get_answer:find_open_tasks:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
      })

      try {
        const tasks = await dbClient
          .selectFrom('homie.task')
          .leftJoin(
            'homie.contributor_task',
            'homie.contributor_task.task_id',
            'homie.task.id',
          )
          .groupBy('homie.task.id')
          .where('organization_id', '=', organization.id)
          .where('task_status_id', '=', taskStatus.open) // available
          .where('homie.contributor_task.contributor_id', 'is', null) // unassigned
          .orderBy('priority_level', 'asc') // most important first
          .orderBy('due_date', 'asc') // If any are due get those next
          .orderBy('homie.task.created_at', 'desc') // oldest first
          .limit(8)
          .select([
            'homie.task.name',
            'homie.task.description',
            'homie.task.html_url',
            'homie.task.id',
          ])
          .execute()

        if (tasks.length === 0) {
          logger.debug('No tasks found', {
            event: 'get_answer:find_open_tasks:no_tasks',
            answer_id: answerId,
            organization: getOrganizationLogData(organization),
          })

          return 'No available tasks'
        }

        logger.debug('Found tasks', {
          event: 'get_answer:find_open_tasks:got_tasks',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          tasks,
        })

        return JSON.stringify(tasks)
      } catch (error) {
        logger.debug('Failed to find tasks', {
          event: 'get_answer:find_open_tasks:failed',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
        })

        return 'FAILED'
      }
    },
  })
}
