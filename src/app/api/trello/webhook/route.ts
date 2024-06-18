import { verifyTrelloWebhook } from '@/lib/trello/verify-trello-webhook'
import { dispatch } from '@/queue/default-queue'
import { NextRequest, NextResponse } from 'next/server'

export const POST = async (request: NextRequest) => {
  // TODO: handle webhooks!
  // - create task
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
    default:
      return NextResponse.json({})
  }
}

export const HEAD = async () => {
  // Send a 200 for Trello endpoint validation
  return NextResponse.json({})
}
