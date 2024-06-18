import { UpdateHomieTaskFromTrelloTask } from '@/queue/jobs'
import { dbClient } from '@/database/client'
import { classifyTask } from '@/lib/ai/clasify-task'
import { dispatch } from '@/queue/default-queue'
import { parseISO } from 'date-fns'

export async function handleUpdateHomieTaskFromTrelloTask(
  job: UpdateHomieTaskFromTrelloTask,
) {
  const { board, card, list } = job.data

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
    .select(['id', 'description', 'due_date'])
    .executeTakeFirst()

  if (!task) {
    await dispatch('create_homie_task_from_trello_task', {
      board,
      card,
      list,
    })
    return
  }

  const { task_type_id, priority_level } = await classifyTask({
    title: card.name,
    description: card.desc ?? task.description,
  })

  await dbClient
    .updateTable('homie.task')
    .set({
      name: card.name,
      description: card.desc ?? task.description,
      due_date: card.due ? parseISO(card.due) : task.due_date,
      organization_id: organization.id,
      priority_level,
      task_type_id,
    })
    .where('homie.task.id', '=', task.id)
    .executeTakeFirstOrThrow()
}
