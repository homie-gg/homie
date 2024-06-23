import { dbClient } from '@/database/client'

interface AssignContributorFromTrelloMemberParams {
  board: {
    id: string
  }
  card: {
    id: string
  }
  idMember: string
}

export async function assignContributorFromTrelloMember(
  params: AssignContributorFromTrelloMemberParams,
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
    .select(['id'])
    .executeTakeFirst()

  if (!task) {
    return
  }

  // Create assignment
  await dbClient
    .insertInto('homie.contributor_task')
    .values({
      task_id: task.id,
      contributor_id: contributor.id,
    })
    .onConflict((oc) => {
      return oc.columns(['contributor_id', 'task_id']).doNothing()
    })
    .executeTakeFirst()
}
