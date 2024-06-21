import { createAsanaClient } from '@/lib/asana/create-asana-client'
import { getLinkedTaskUrls } from '@/lib/tasks/get-linked-task-urls'
import { getShortIdFromCardUrl } from '@/lib/trello/get-short-id-from-card-url'

interface findLinkedAsanaTaskParams {
  body: string | null
  asanaAccessToken: string
}

export async function findLinkedAsanaTask(
  params: findLinkedAsanaTaskParams,
): Promise<string | null> {
  const { body, asanaAccessToken } = params

  if (!body) {
    return null
  }

  let result = ''

  const taskUrls = getLinkedTaskUrls({
    pullRequestBody: body,
  })

  const asana = createAsanaClient(asanaAccessToken)

  for (const taskUrl of taskUrls) {
    const extAsanaTaskId = getShortIdFromCardUrl({ url: taskUrl })

    const task = await asana.get<{ name: string; notes: string }>(
      `/tasks/${extAsanaTaskId}`,
    )

    result += `\n${task.name}: ${task.notes}`
  }

  return result
}
