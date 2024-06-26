import { dbClient } from '@/database/client'
import { assignContributorFromTrelloMember } from '@/lib/trello/assign-contributor-from-trello-member'
import { unassignContributorFromTrelloMember } from '@/lib/trello/unassign-contributor-from-trello-member'
import { verifyTrelloWebhook } from '@/lib/trello/verify-trello-webhook'
import { dispatch } from '@/queue/default-queue'
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
      await dispatch('create_homie_task_from_trello_task', {
        board: action.data.board,
        card: action.data.card,
      })

      break
    case 'updateCard': {
      await dispatch('update_homie_task_from_trello_task', {
        board: action.data.board,
        card: action.data.card,
        updated_fields: Object.keys(action.data.old) as any, // untyped anyway
      })

      break
    }
    case 'deleteCard': {
      await dbClient
        .deleteFrom('homie.task')
        .where('ext_trello_card_id', '=', action.data.card.id)
        .executeTakeFirst()

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
