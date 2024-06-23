import { parse, parseISO } from 'date-fns'
import { SyncAsanaTaskToHomieTask } from '@/queue/jobs'
import { dbClient } from '@/database/client'
import { AsanaClient, createAsanaClient } from '@/lib/asana/create-asana-client'
import { AsanaGetTaskResponse } from '@/lib/asana/types'
import { classifyTask } from '@/lib/ai/clasify-task'
import { taskStatus } from '@/lib/tasks'
import { createHomieTaskFromAsanaTask } from '@/lib/asana/create-homie-task-from-asana-task'

export async function handleSyncAsanaTaskToHomieTask(
  job: SyncAsanaTaskToHomieTask,
) {
  const { ext_asana_task_id, project_id } = job.data

  const project = await dbClient
    .selectFrom('asana.project')
    .where('asana.project.id', '=', project_id)
    .where('enabled', '=', true)
    .select(['asana.project.organization_id'])
    .executeTakeFirst()

  if (!project) {
    return
  }

  const appUser = await dbClient
    .selectFrom('asana.app_user')
    .where('organization_id', '=', project.organization_id)
    .select(['asana_access_token'])
    .executeTakeFirst()

  if (!appUser) {
    return
  }

  const asana = createAsanaClient(appUser.asana_access_token)

  const asanaTask = await tryGetTask(ext_asana_task_id, asana)
  if (!asanaTask) {
    await dbClient
      .deleteFrom('homie.task')
      .where('ext_asana_task_id', '=', ext_asana_task_id)
      .executeTakeFirst()
    return
  }

  const homieTask = await dbClient
    .selectFrom('homie.task')
    .where('ext_asana_task_id', '=', ext_asana_task_id)
    .select(['id', 'name', 'description', 'priority_level', 'task_type_id'])
    .executeTakeFirst()

  if (!homieTask) {
    await createHomieTaskFromAsanaTask({ asanaTask, project })
    return
  }

  const requiresClassification =
    asanaTask.name !== homieTask.name ||
    asanaTask.notes !== homieTask.description

  const classification = requiresClassification
    ? await classifyTask({
        title: asanaTask.name,
        description: asanaTask.notes,
      })
    : null

  await dbClient
    .updateTable('homie.task')
    .set({
      name: asanaTask.name,
      description: asanaTask.notes,
      due_date: asanaTask.due_at
        ? parseISO(asanaTask.due_at)
        : asanaTask.due_on
          ? parse(asanaTask.due_on, 'yyyy-LL-dd', new Date())
          : null,
      organization_id: project.organization_id,
      task_status_id: asanaTask.completed ? taskStatus.done : taskStatus.open,
      priority_level: classification
        ? classification.priority_level
        : homieTask.priority_level,
      task_type_id: classification
        ? classification.task_type_id
        : homieTask.task_type_id,
    })
    .where('homie.task.id', '=', homieTask.id)
    .executeTakeFirstOrThrow()

  // TODO sync assignee
}

async function tryGetTask(extAsanaTaskId: string, asana: AsanaClient) {
  try {
    const { data: task } = await asana.get<AsanaGetTaskResponse>(
      `/tasks/${extAsanaTaskId}`,
    )
    return task
  } catch {
    return null
  }
}
