import { createAsanaClient } from '@/lib/asana/create-asana-client'
import { getAsanaTaskIdFromUrl } from '@/lib/asana/get-asana-task-id-from-url'
import { getLinkedTaskUrls } from '@/lib/tasks/get-linked-task-urls'

interface CloseLinkedAsanaTasksParams {
  pullRequestBody: string | null
  asanaAppUser: {
    asana_access_token: string
  }
}

export async function closeLinkedAsanaTasks(
  params: CloseLinkedAsanaTasksParams,
) {
  const { asanaAppUser, pullRequestBody } = params

  if (!pullRequestBody) {
    return
  }

  const asana = createAsanaClient(asanaAppUser.asana_access_token)

  const taskUrls = getLinkedTaskUrls({ pullRequestBody: pullRequestBody })

  for (const url of taskUrls) {
    const extAsanaTaskId = getAsanaTaskIdFromUrl({ url })
    if (!extAsanaTaskId) {
      continue
    }

    await asana.put(`/tasks/${extAsanaTaskId}`, {
      data: {
        completed: true,
      },
    })
  }
}
