import { createAsanaClient } from '@/lib/asana/create-asana-client'
import { getAsanaTaskIdFromUrl } from '@/lib/asana/get-asana-task-if-from-url'
import { AsanaGetTaskResponse } from '@/lib/asana/types'
import { getLinkedTaskUrls } from '@/lib/tasks/get-linked-task-urls'

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
    const extAsanaTaskId = getAsanaTaskIdFromUrl({ url: taskUrl })
    if (!extAsanaTaskId) {
      continue
    }

    const { data: task } = await asana.get<AsanaGetTaskResponse>(
      `/tasks/${extAsanaTaskId}`,
    )

    if (!task.name && !task.notes) {
      return ''
    }

    if (!task.notes) {
      result += `\n${task.name}`
      continue
    }

    if (!task.name) {
      result += `\n${task.notes}`
      continue
    }

    result += `\n${task.name}: ${task.notes}`
  }

  return result
}
