import { dbClient } from '@/database/client'
import { classifyTask } from '@/lib/ai/clasify-task'
import { embedTask } from '@/lib/ai/embed-task'
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
  const homieTask = await dbClient
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
      'created_at'
    ])
    .executeTakeFirstOrThrow()

  await embedTask({ task: homieTask })

  if (!asanaTask.assignee) {
    return
  }

  const contributor = await dbClient
    .selectFrom('homie.contributor')
    .where('ext_asana_user_id', '=', asanaTask.assignee.gid)
    .select(['id'])
    .executeTakeFirst()

  if (!contributor) {
    return
  }

  // Create assignment
  await dbClient
    .insertInto('homie.contributor_task')
    .values({
      task_id: homieTask.id,
      contributor_id: contributor.id,
    })
    .onConflict((oc) => {
      return oc.columns(['contributor_id', 'task_id']).doNothing()
    })
    .executeTakeFirst()
}
