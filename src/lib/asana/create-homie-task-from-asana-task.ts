import { dbClient } from '@/database/client'
import { classifyTask } from '@/lib/ai/classify-task'
import { embedTask } from '@/lib/ai/embed-task'
import { AsanaGetTaskResponse } from '@/lib/asana/types'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { taskStatus } from '@/lib/tasks'
import { setTaskComplexity } from '@/queue/jobs/calculate-task-complexity'
import { checkForDuplicateTask } from '@/queue/jobs/check-for-duplicate-task'
import { sendSimilarPullRequestsForTask } from '@/queue/jobs/send-similar-pull-requests-for-task'

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
    logData: {
      organization: getOrganizationLogData({
        id: project.organization_id,
      }),
    },
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
      'created_at',
      'ext_asana_task_id',
      'ext_gh_issue_number',
      'github_repo_id',
      'ext_trello_card_id',
    ])
    .executeTakeFirstOrThrow()

  await embedTask({ task: homieTask })

  await checkForDuplicateTask.dispatch(
    {
      task: homieTask,
    },
    {
      debounce: {
        key: `check_duplicate_task:${homieTask.id}`,
        delaySecs: 600,
      },
    },
  )

  await setTaskComplexity.dispatch(
    {
      task: homieTask,
    },
    {
      debounce: {
        key: `calculate_task_complexity:${homieTask.id}`,
        delaySecs: 600,
      },
    },
  )

  await sendSimilarPullRequestsForTask.dispatch(
    {
      task: homieTask,
    },
    {
      debounce: {
        key: `send_similar_pull_requests_for_task:${homieTask.id}`,
        delaySecs: 10800,
      },
    },
  )

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
