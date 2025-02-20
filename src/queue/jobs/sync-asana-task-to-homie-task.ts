import { createJob } from '@/queue/create-job'
import { parse, parseISO } from 'date-fns'
import { dbClient } from '@/database/client'
import { AsanaClient, createAsanaClient } from '@/lib/asana/create-asana-client'
import { AsanaGetTaskResponse } from '@/lib/asana/types'
import { classifyTask } from '@/lib/ai/classify-task'
import { taskStatus } from '@/lib/tasks'
import { createHomieTaskFromAsanaTask } from '@/lib/asana/create-homie-task-from-asana-task'
import { embedTask } from '@/lib/ai/embed-task'
import { removeTaskEmbedding } from '@/lib/ai/remove-task-embedding'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { checkForDuplicateTask } from '@/queue/jobs/check-for-duplicate-task'
import { setTaskComplexity } from '@/queue/jobs/calculate-task-complexity'
import { sendSimilarPullRequestsForTask } from '@/queue/jobs/send-similar-pull-requests-for-task'

export const syncAsanaTaskToHomieTask = createJob({
  id: 'sync_asana_task_to_homie_task',
  handle: async (payload: {
    ext_asana_task_id: string
    project_id: number
  }) => {
    const { ext_asana_task_id, project_id } = payload

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
      await deleteAsanaTask(ext_asana_task_id)
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
          logData: {
            organization: getOrganizationLogData({
              id: project.organization_id,
            }),
          },
        })
      : null

    const updatedTask = await dbClient
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
        completed_at: asanaTask.completed ? new Date() : null,
      })
      .where('homie.task.id', '=', homieTask.id)
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
        'created_at',
        'ext_asana_task_id',
        'github_repo_id',
        'ext_gh_issue_number',
        'ext_trello_card_id',
      ])
      .executeTakeFirstOrThrow()

    await embedTask({ task: updatedTask })

    await checkForDuplicateTask.dispatch(
      {
        task: updatedTask,
      },
      {
        debounce: {
          key: `check_duplicate_task:${updatedTask.id}`,
          delaySecs: 600,
        },
      },
    )

    await setTaskComplexity.dispatch(
      {
        task: updatedTask,
      },
      {
        debounce: {
          key: `calculate_task_complexity:${updatedTask.id}`,
          delaySecs: 600,
        },
      },
    )

    await sendSimilarPullRequestsForTask.dispatch(
      {
        task: updatedTask,
      },
      {
        debounce: {
          key: `send_similar_pull_requests_for_task:${updatedTask.id}`,
          delaySecs: 10800,
        },
      },
    )

    // If no assignee, we'll remove any assignments (if they exist)
    if (!asanaTask.assignee) {
      await dbClient
        .deleteFrom('homie.contributor_task')
        .where('homie.contributor_task.task_id', '=', homieTask.id)
        .execute()
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
  },
})

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

async function deleteAsanaTask(extAsanaTaskId: string) {
  const deletedTask = await dbClient
    .deleteFrom('homie.task')
    .where('ext_asana_task_id', '=', extAsanaTaskId)
    .returning(['id', 'organization_id'])
    .executeTakeFirst()

  if (deletedTask) {
    await removeTaskEmbedding({ task: deletedTask })
  }
}
