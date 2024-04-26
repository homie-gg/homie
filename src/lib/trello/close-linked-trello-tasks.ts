import { getLinkedTaskUrls } from '@/lib/pull-request/get-linked-task-urls'
import { createTrelloClient } from '@/lib/trello/create-trello-client'
import { getShortIdFromCardUrl } from '@/lib/trello/get-short-id-from-card-url'

interface CloseLinkedTrelloTasksParams {
  pullRequest: {
    body: string | null
  }
  trelloWorkspace: {
    trello_access_token: string
    ext_trello_done_task_list_id: string | null
  }
}

export async function closeLinkedTrelloTasks(
  params: CloseLinkedTrelloTasksParams,
) {
  const { trelloWorkspace, pullRequest } = params

  if (!trelloWorkspace.ext_trello_done_task_list_id) {
    return
  }

  if (!pullRequest.body) {
    return
  }

  const trelloClient = createTrelloClient(trelloWorkspace.trello_access_token)

  const taskUrls = getLinkedTaskUrls({ pullRequestBody: pullRequest.body })

  for (const url of taskUrls) {
    const shortId = getShortIdFromCardUrl({ url })
    if (!shortId) {
      continue
    }

    // Move to done list
    await trelloClient.put(`/cards/${shortId}`, {
      idList: trelloWorkspace.ext_trello_done_task_list_id,
    })
  }
}
