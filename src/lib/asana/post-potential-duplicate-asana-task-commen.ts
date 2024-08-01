import { postAsanaTaskComment } from '@/lib/asana/post-asana-task-comment'
import { getDuplicateTaskMessage } from '@/lib/tasks/get-duplicate-task-message'

interface PostPotentialDuplicateAsanaTaskCommentParams {
  targetTask: {
    ext_asana_task_id: string
  }
  duplicateTask: {
    name: string
    html_url: string
  }
  organization: {
    id: number
    asana_access_token: string
  }
}

export async function postPotentialDuplicateAsanaTaskComment(
  params: PostPotentialDuplicateAsanaTaskCommentParams,
) {
  const { targetTask, organization, duplicateTask } = params

  // TODO: Test asana make sure comment goes out with markdown link
  await postAsanaTaskComment({
    asanaAccessToken: organization.asana_access_token,
    extAsanaTaskId: targetTask.ext_asana_task_id,
    text: getDuplicateTaskMessage({ task: duplicateTask }),
  })
}
