import { postAsanaTaskComment } from '@/lib/asana/post-asana-task-comment'

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

  await postAsanaTaskComment({
    asanaAccessToken: organization.asana_access_token,
    extAsanaTaskId: targetTask.ext_asana_task_id,
    html: `<body>This might be a duplicate of: <a href="${duplicateTask.html_url}">${duplicateTask.name}</a></body>`,
  })
}
