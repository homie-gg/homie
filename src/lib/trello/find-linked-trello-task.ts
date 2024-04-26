import { getLinkedTaskUrls } from '@/lib/pull-request/get-linked-task-urls'
import { createTrelloClient } from '@/lib/trello/create-trello-client'
import { getShortIdFromCardUrl } from '@/lib/trello/get-short-id-from-card-url'
import { TrelloCard } from '@/lib/trello/types'

interface findLinkedTrelloTaskParams {
  pullRequest: {
    body: string | null
  }
  trelloAccessToken: string
}

export async function getLinkedTrelloTask(
  params: findLinkedTrelloTaskParams,
): Promise<string | null> {
  const { pullRequest, trelloAccessToken } = params

  if (!pullRequest.body) {
    return null
  }

  let result = ''

  const taskUrls = getLinkedTaskUrls({
    pullRequestBody: pullRequest.body,
  })

  const trelloClient = createTrelloClient(trelloAccessToken)

  for (const taskUrl of taskUrls) {
    const shortId = getShortIdFromCardUrl({ url: taskUrl })

    const card = await trelloClient.get<TrelloCard>(`/cards/${shortId}`)

    result += `\n${card.desc}`
  }

  return result
}
