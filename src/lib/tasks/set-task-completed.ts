import { dbClient } from '@/database/client'
import { embedTask } from '@/lib/ai/embed-task'
import { taskStatus } from '@/lib/tasks/task-status'

interface SetTaskCompletedParams {
  task_id: number
}

export async function setTaskCompleted(params: SetTaskCompletedParams) {
  const { task_id } = params

  const updatedTask = await dbClient
    .updateTable('homie.task')
    .where('id', '=', task_id)
    .set({
      task_status_id: taskStatus.done,
      completed_at: new Date(),
    })
    .returning([
      'id',
      'name',
      'description',
      'task_status_id',
      'task_type_id',
      'html_url',
      'due_date',
      'completed_at',
      'priority_level',
      'organization_id',
    ])
    .executeTakeFirstOrThrow()

  await embedTask({ task: updatedTask })
}
