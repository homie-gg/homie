import { dbClient } from '@/database/client'
import { classifyTask } from '@/lib/ai/clasify-task'
import { AsanaGetTaskResponse } from '@/lib/asana/types'
import { taskStatus } from '@/lib/tasks'

interface CreateHomieTaskFromAsanaTaskParams {
  asanaTask: AsanaGetTaskResponse['data']
  project: {
    organization_id: number
  }
}

export async function createHomieTaskFromAsanaTask(
  params: CreateHomieTaskFromAsanaTaskParams,
) {
  const { asanaTask, project } = params

  const { task_type_id, priority_level } = await classifyTask({
    title: asanaTask.name,
    description: asanaTask.notes,
  })
  await dbClient
    .insertInto('homie.task')
    .values({
      name: asanaTask.name,
      description: asanaTask.notes,
      html_url: asanaTask.permalink_url,
      organization_id: project.organization_id,
      task_status_id: asanaTask.completed ? taskStatus.done : taskStatus.open,
      priority_level,
      task_type_id,
      ext_asana_task_id: asanaTask.gid,
    })
    .onConflict((oc) =>
      oc.column('ext_asana_task_id').doUpdateSet({
        name: asanaTask.name,
        description: asanaTask.notes,
        html_url: asanaTask.permalink_url,
        organization_id: project.organization_id,
        task_status_id: asanaTask.completed ? taskStatus.done : taskStatus.open,
        priority_level,
        task_type_id,
      }),
    )
    .returning(['id'])
    .executeTakeFirstOrThrow()

  if (asanaTask.assignee) {
    // TODO create assignee
  }
}
