import { getLinkedTaskUrls } from '@/lib/tasks/get-linked-task-urls'
import { createTrelloClient } from '@/lib/trello/create-trello-client'
import { getTrelloShortIdFromCardUrl } from '@/lib/trello/get-short-id-from-card-url'

interface CloseLinkedTrelloTasksParams {
  pullRequestBody: string | null
  trelloWorkspace: {
    trello_access_token: string
    ext_trello_done_task_list_id: string | null
  }
}

export async function closeLinkedTrelloTasks(
  params: CloseLinkedTrelloTasksParams,
) {
  const { trelloWorkspace, pullRequestBody } = params

  if (!trelloWorkspace.ext_trello_done_task_list_id) {
    return
  }

  if (!pullRequestBody) {
    return
  }

  const trelloClient = createTrelloClient(trelloWorkspace.trello_access_token)

  const taskUrls = getLinkedTaskUrls({ pullRequestBody: pullRequestBody })

  for (const url of taskUrls) {
    const shortId = getTrelloShortIdFromCardUrl({ url })
    if (!shortId) {
      continue
    }

    // Move to done list
    await trelloClient.put(`/cards/${shortId}`, {
      idList: trelloWorkspace.ext_trello_done_task_list_id,
    })
  }
}
