import { dbClient } from '@/database/client'
import { verifyTrelloWebhook } from '@/lib/trello/verify-trello-webhook'
import { dispatch } from '@/queue/default-queue'
import { NextRequest, NextResponse } from 'next/server'

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
        list: action.data.list,
      })
    case 'updateCard': {
      await dispatch('update_homie_task_from_trello_task', {
        board: action.data.board,
        card: action.data.card,
        list: action.data.list,
      })
    }
    case 'deleteCard': {
      await dbClient
        .deleteFrom('homie.task')
        .where('ext_trello_card_id', '=', action.data.card.id)
        .executeTakeFirst()
    }
    default:
      return NextResponse.json({})
  }
}

export const HEAD = async () => {
  // Send a 200 for Trello endpoint validation
  return NextResponse.json({})
}
