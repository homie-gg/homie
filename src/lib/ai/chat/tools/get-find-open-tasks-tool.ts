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
        return 'No available tasks'
      }

      return [
        'Open tasks:',
        ...tasks.map(
          (task) => `- [${task.name}](#${task.html_url}): ${task.description}`,
        ),
      ].join('\n')
    },
  })
}
