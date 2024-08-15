import { UpdateHomieTaskFromTrelloTask } from '@/queue/jobs'
import { dbClient } from '@/database/client'
import { classifyTask } from '@/lib/ai/classify-task'
import { dispatch } from '@/queue/dispatch'
import { parseISO } from 'date-fns'
import { taskStatus } from '@/lib/tasks'
import { embedTask } from '@/lib/ai/embed-task'

export async function handleUpdateHomieTaskFromTrelloTask(
  job: UpdateHomieTaskFromTrelloTask,
) {
  const { board, card, updated_fields } = job.data

  const trelloWorkspace = await dbClient
    .selectFrom('trello.workspace')
    .where('ext_trello_board_id', '=', board.id)
    .select([
      'trello_access_token',
      'organization_id',
      'ext_trello_done_task_list_id',
    ])
    .executeTakeFirst()

  if (!trelloWorkspace) {
    return
  }

  const organization = await dbClient
    .selectFrom('homie.organization')
    .where('id', '=', trelloWorkspace.organization_id)
    .select(['id'])
    .executeTakeFirst()

  if (!organization) {
    return
  }

  const task = await dbClient
    .selectFrom('homie.task')
    .where('ext_trello_card_id', '=', card.id)
    .select(['id', 'description', 'due_date', 'task_type_id', 'priority_level'])
    .executeTakeFirst()

  if (!task) {
    await dispatch('create_homie_task_from_trello_task', {
      board,
      card,
    })
    return
  }

  const { task_type_id, priority_level } = await getClassification({
    task,
    card,
    updated_fields,
  })

  const updatedTask = await dbClient
    .updateTable('homie.task')
    .set({
      name: card.name,
      description: card.desc ?? task.description,
      due_date: card.due ? parseISO(card.due) : task.due_date,
      organization_id: organization.id,
      task_status_id: getTaskStatus({
        card,
        extTrelloDoneListTaskId: trelloWorkspace.ext_trello_done_task_list_id,
      }),
      priority_level,
      task_type_id,
    })
    .where('homie.task.id', '=', task.id)
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
      'ext_gh_issue_id',
      'ext_gh_issue_number',
      'github_repo_id',
      'ext_asana_task_id',
      'ext_trello_card_id',
    ])

    .executeTakeFirstOrThrow()

  await embedTask({ task: updatedTask })

  await dispatch(
    'check_for_duplicate_task',
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

  await dispatch(
    'calculate_task_complexity',
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

  await dispatch(
    'send_similar_pull_requests_for_task',
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
}

interface GetTaskStatusParams {
  card: {
    closed?: boolean
    idList?: string
  }
  extTrelloDoneListTaskId: string | null
}
function getTaskStatus(params: GetTaskStatusParams) {
  const { card, extTrelloDoneListTaskId } = params
  if (card.closed) {
    return taskStatus.done
  }

  if (card.idList === extTrelloDoneListTaskId) {
    return taskStatus.done
  }

  return taskStatus.open
}

interface GetClassificationParams {
  card: {
    name: string
    desc?: string
  }
  task: {
    priority_level: number
    task_type_id: number
    description: string
  }
  updated_fields: Array<'name' | 'desc' | 'due'>
}

interface GetClassificationResult {
  priority_level: number
  task_type_id: number
}

async function getClassification(
  params: GetClassificationParams,
): Promise<GetClassificationResult> {
  const { card, updated_fields, task } = params

  // Only re-classify if the name or description has changed.
  if (!updated_fields.includes('name') && !updated_fields.includes('desc')) {
    return task
  }

  return classifyTask({
    title: card.name,
    description: card.desc ?? task.description,
  })
}
