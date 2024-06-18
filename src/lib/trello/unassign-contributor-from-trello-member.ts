import { dbClient } from '@/database/client'

interface UnassignContributorFromTrelloMemberParams {
  board: {
    id: string
  }
  card: {
    id: string
  }
  idMember: string
}

export async function unassignContributorFromTrelloMember(
  params: UnassignContributorFromTrelloMemberParams,
) {
  const { board, idMember, card } = params
  const trelloWorkspace = await dbClient
    .selectFrom('trello.workspace')
    .where('ext_trello_board_id', '=', board.id)
    .select(['organization_id'])
    .executeTakeFirst()
  if (!trelloWorkspace) {
    return
  }

  const contributor = await dbClient
    .selectFrom('homie.contributor')
    .where('ext_trello_member_id', '=', idMember)
    .where('organization_id', '=', trelloWorkspace.organization_id)
    .select(['id'])
    .executeTakeFirst()

  if (!contributor) {
    return
  }

  const task = await dbClient
    .selectFrom('homie.task')
    .where('ext_trello_card_id', '=', card.id)
    .select(['id', 'description', 'due_date', 'task_type_id', 'priority_level'])
    .executeTakeFirst()

  if (!task) {
    return
  }

  // Create assignment
  await dbClient
    .deleteFrom('homie.contributor_task')
    .where('homie.contributor_task.task_id', '=', task.id)
    .where('homie.contributor_task.contributor_id', '=', contributor.id)
    .executeTakeFirst()
}
