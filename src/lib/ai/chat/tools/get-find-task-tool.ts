import { findTask } from '@/lib/tasks/find-task'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

interface GetFindTaskTool {
  organization: {
    id: number
    ext_gh_install_id: number | null
  }
}

export function getFindTaskTool(params: GetFindTaskTool) {
  const { organization } = params
  return new DynamicStructuredTool({
    name: 'find_task',
    description: 'Finds a given task.',
    schema: z.object({
      name: z.string().describe('Name of the task').optional(),
      task_id: z
        .number()
        .describe('Task ID for the task to mark as done.')
        .optional(),
    }),
    func: async (params) => {
      const { task_id, name } = params

      const task = await findTask({
        organization_id: organization.id,
        id: task_id,
        name,
      })

      if (!task) {
        return 'Could not find task.'
      }

      return `[${task.name}](${task.html_url}): ${task.description}`
    },
  })
}
