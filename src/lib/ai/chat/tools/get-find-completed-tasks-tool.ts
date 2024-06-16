import { dbClient } from '@/database/client'
import { taskStatus } from '@/lib/tasks'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

interface GetFindCompletedTasksToolParams {
  organization: {
    id: number
  }
}

export function getFindCompletedTasksTool(
  params: GetFindCompletedTasksToolParams,
) {
  const { organization } = params
  return new DynamicStructuredTool({
    name: 'find_completed_tasks',
    description: 'Find tasks that were completed since the given date',
    schema: z.object({
      date: z.coerce
        .date()
        .describe('The lower bound date of when tasks were completed.'),
    }),
    func: async (params) => {
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
        return 'No tasks have been completed since the given date.'
      }

      return tasks
        .map(
          (task) =>
            `Title: ${task.name} | Description: ${task.description} | URL: ${task.html_url}`,
        )
        .join('\n')
    },
  })
}
