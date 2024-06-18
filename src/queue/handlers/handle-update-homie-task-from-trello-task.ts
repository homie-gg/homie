import { UpdateHomieTaskFromTrelloTask } from '@/queue/jobs'
import { dbClient } from '@/database/client'
import { classifyTask } from '@/lib/ai/clasify-task'
import { dispatch } from '@/queue/default-queue'
import { parseISO } from 'date-fns'
import { taskStatus } from '@/lib/tasks'

export async function handleUpdateHomieTaskFromTrelloTask(
  job: UpdateHomieTaskFromTrelloTask,
) {
  const { board, card, list, updated_fields } = job.data

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
      list,
    })
    return
  }

  const { task_type_id, priority_level } = await getClassification({
    task,
    card,
    updated_fields,
  })

  await dbClient
    .updateTable('homie.task')
    .set({
      name: card.name,
      description: card.desc ?? task.description,
      due_date: card.due ? parseISO(card.due) : task.due_date,
      organization_id: organization.id,
      task_status_id: getTaskStatus(card),
      priority_level,
      task_type_id,
    })
    .where('homie.task.id', '=', task.id)
    .executeTakeFirstOrThrow()
}

function getTaskStatus(card: { closed?: boolean }) {
  if (card.closed === undefined) {
    return undefined
  }

  return card.closed ? taskStatus.done : taskStatus.open
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
