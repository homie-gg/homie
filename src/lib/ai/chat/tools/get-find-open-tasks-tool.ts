import { dbClient } from '@/database/client'
import { taskStatus } from '@/lib/tasks'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

interface GetFindOpenTasksToolParams {
  organization: {
    id: number
  }
}

export function getFindOpenTasksTool(params: GetFindOpenTasksToolParams) {
  const { organization } = params
  return new DynamicStructuredTool({
    name: 'find_open_tasks',
    description: 'Find open tasks that are ready to work on',
    schema: z.object({}),
    func: async () => {
      const tasks = await dbClient
        .selectFrom('homie.task')
        .where('organization_id', '=', organization.id)
        .where('task_status_id', '=', taskStatus.open)
        .orderBy('priority_level', 'asc') // most important first
        .orderBy('due_date', 'asc') // If any are due get those next
        .orderBy('created_at', 'desc') // oldest first
        .limit(8)
        .select(['name', 'description', 'html_url', 'id'])
        .execute()

      if (tasks.length === 0) {
        return 'No available tasks'
      }

      return tasks
        .map(
          (task) =>
            `Title: ${task.name} | Description: ${task.description} | URL: ${task.html_url} | Task ID: ${task.id}`,
        )
        .join('\n')
    },
  })
}
