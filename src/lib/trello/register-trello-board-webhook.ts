import { dbClient } from '@/database/client'
import { http } from '@/lib/http/client/http'
import { TrelloWebhook } from '@/lib/trello/types'

interface RegisterTrelloBoardWebhookParams {
  organization: {
    id: number
  }
  ext_trello_board_id?: string
}

const webhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/trello/webhook`

export async function registerTrelloBoardWebhook(
  params: RegisterTrelloBoardWebhookParams,
) {
  const { organization, ext_trello_board_id } = params

  const trelloWorkspace = await dbClient
    .selectFrom('trello.workspace')
    .where('organization_id', '=', organization.id)
    .select(['ext_trello_board_id', 'trello_access_token'])
    .executeTakeFirstOrThrow()

  if (!ext_trello_board_id) {
    return
  }

  const webhooks = await listWebhooks(trelloWorkspace.trello_access_token)

  // Remove all webhooks
  await Promise.all(
    webhooks.map((webhook) =>
      tryDeleteWebhook(trelloWorkspace.trello_access_token, webhook.id),
    ),
  )

  await addWebhook(trelloWorkspace.trello_access_token, ext_trello_board_id)
}

async function listWebhooks(accessToken: string) {
  return http.get<TrelloWebhook[]>(
    `https://api.trello.com/1/tokens/${accessToken}/webhooks/?key=${process.env.NEXT_PUBLIC_TRELLO_API_KEY}`,
  )
}

async function addWebhook(accessToken: string, boardId: string) {
  // Reference: https://developer.atlassian.com/cloud/trello/guides/rest-api/webhooks/
  return http.post<TrelloWebhook>(
    `https://api.trello.com/1/tokens/${accessToken}/webhooks/?key=${process.env.NEXT_PUBLIC_TRELLO_API_KEY}`,
    {
      description: 'Homie board management webhook',
      callbackURL: webhookUrl,
      idModel: boardId,
    },
  )
}

async function tryDeleteWebhook(accessToken: string, webhookId: string | null) {
  if (!webhookId) {
    return
  }

  try {
    await http.delete(
      `https://api.trello.com/1/tokens/${accessToken}/webhooks/${webhookId}?key=${process.env.NEXT_PUBLIC_TRELLO_API_KEY}`,
    )
  } catch {
    // ignore failing to delete a webhook (i.e., when it doesn't exist.)
  }
}
