import { postAsanaTaskComment } from '@/lib/asana/post-asana-task-comment'

interface PostUnclosedAsanaTaskCommentParams {
  task: {
    ext_asana_task_id: string
  }
  pullRequest: {
    title: string
    html_url: string
  }
  organization: {
    id: number
    asana_access_token: string
  }
}

export async function postUnclosedAsanaTaskComment(
  params: PostUnclosedAsanaTaskCommentParams,
) {
  const { task, organization, pullRequest } = params

  await postAsanaTaskComment({
    asanaAccessToken: organization.asana_access_token,
    extAsanaTaskId: task.ext_asana_task_id,
    html: `<body>This might have already been done via: <a href="${pullRequest.html_url}">${pullRequest.title}</a></body>`,
  })
}
