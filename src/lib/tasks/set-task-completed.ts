import { dbClient } from '@/database/client'
import { taskStatus } from '@/lib/tasks/task-status'

interface SetTaskCompletedParams {
  task_id: number
}

export async function setTaskCompleted(params: SetTaskCompletedParams) {
  const { task_id } = params

  await dbClient
    .updateTable('homie.task')
    .where('id', '=', task_id)
    .set({
      task_status_id: taskStatus.done,
      completed_at: new Date(),
    })
    .executeTakeFirstOrThrow()
}
