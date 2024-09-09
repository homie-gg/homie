import { dbClient } from '@/database/client'
import { removeTaskEmbedding } from '@/lib/ai/remove-task-embedding'
import { assignContributorFromTrelloMember } from '@/lib/trello/assign-contributor-from-trello-member'
import { unassignContributorFromTrelloMember } from '@/lib/trello/unassign-contributor-from-trello-member'
import { verifyTrelloWebhook } from '@/lib/trello/verify-trello-webhook'
import { createHomieTaskFromTrelloTask } from '@/queue/jobs/create-homie-task-from-trello-task'
import { updateHomieTaskFromTrelloTask } from '@/queue/jobs/update-homie-task-from-trello-task'
import { NextRequest, NextResponse } from 'next/server'

// Send a 200 for Trello endpoint validation
export const HEAD = async () => {
  return NextResponse.json({})
}

export const POST = async (request: NextRequest) => {
  const data = await request.json()
  const isValid = verifyTrelloWebhook({
    data,
    callbackURL: data.webhook.callbackURL,
    webhookHash: request.headers.get('x-trello-webhook') ?? '',
  })

  if (!isValid) {
    return NextResponse.json({})
  }

  const { action } = data

  switch (action.type) {
    case 'createCard':
      await createHomieTaskFromTrelloTask.dispatch({
        board: action.data.board,
        card: action.data.card,
      })

      break
    case 'updateCard': {
      await updateHomieTaskFromTrelloTask.dispatch({
        board: action.data.board,
        card: action.data.card,
        updated_fields: Object.keys(action.data.old) as any, // untyped anyway
      })

      break
    }
    case 'deleteCard': {
      const deletedTask = await dbClient
        .deleteFrom('homie.task')
        .where('ext_trello_card_id', '=', action.data.card.id)
        .returning(['id', 'organization_id'])
        .executeTakeFirst()

      if (deletedTask) {
        await removeTaskEmbedding({ task: deletedTask })
      }

      break
    }

    case 'addMemberToCard': {
      await assignContributorFromTrelloMember({
        board: action.data.board,
        card: action.data.card,
        idMember: action.data.idMember,
      })

      break
    }

    case 'removeMemberFromCard': {
      await unassignContributorFromTrelloMember({
        board: action.data.board,
        card: action.data.card,
        idMember: action.data.idMember,
      })

      break
    }
  }

  return NextResponse.json({})
}
