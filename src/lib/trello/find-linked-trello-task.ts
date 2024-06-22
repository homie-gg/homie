import { getLinkedTaskUrls } from '@/lib/tasks/get-linked-task-urls'
import { createTrelloClient } from '@/lib/trello/create-trello-client'
import { getTrelloShortIdFromCardUrl } from '@/lib/trello/get-short-id-from-card-url'
import { TrelloCard } from '@/lib/trello/types'

interface findLinkedTrelloTaskParams {
  body: string | null
  trelloAccessToken: string
}

export async function findLinkedTrelloTask(
  params: findLinkedTrelloTaskParams,
): Promise<string | null> {
  const { body, trelloAccessToken } = params

  if (!body) {
    return null
  }

  let result = ''

  const taskUrls = getLinkedTaskUrls({
    pullRequestBody: body,
  })

  const trelloClient = createTrelloClient(trelloAccessToken)

  for (const taskUrl of taskUrls) {
    const shortId = getTrelloShortIdFromCardUrl({ url: taskUrl })

    const card = await trelloClient.get<TrelloCard>(`/cards/${shortId}`)

    result += `\n${card.desc}`
  }

  return result
}
