import { CreateHomieTaskFromTrelloTask } from '@/queue/jobs'
import { dbClient } from '@/database/client'
import { classifyTask } from '@/lib/ai/clasify-task'
import { taskStatus } from '@/lib/tasks'

export async function handleCreateHomieTaskFromTrelloTask(
  job: CreateHomieTaskFromTrelloTask,
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

  const { task_type_id, priority_level } = await classifyTask({
    title: card.name,
    description: '',
  })

  const isDone = list.id === trelloWorkspace.ext_trello_done_task_list_id

  await dbClient
    .insertInto('homie.task')
    .values({
      name: card.name,
      description: '',
      html_url: `https://trello.com/c/${card.shortLink}`,
      organization_id: organization.id,
      task_status_id: isDone ? taskStatus.done : taskStatus.open,
      priority_level,
      task_type_id,
      ext_trello_card_id: card.id,
    })
    .onConflict((oc) =>
      oc.column('ext_trello_card_id').doUpdateSet({
        name: card.name,
        description: '',
        html_url: `https://trello.com/c/${card.shortLink}`,
        organization_id: organization.id,
        task_status_id: isDone ? taskStatus.done : taskStatus.open,
        priority_level,
        task_type_id,
      }),
    )
    .returning(['id'])
    .executeTakeFirstOrThrow()
}