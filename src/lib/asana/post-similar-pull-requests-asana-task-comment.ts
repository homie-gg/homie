import { postAsanaTaskComment } from '@/lib/asana/post-asana-task-comment'

interface PostSimilarPullRequestsAsanaTaskCommentParams {
  targetTask: {
    ext_asana_task_id: string
  }
  pullRequests: Array<{ id: number; title: string; html_url: string }>
  organization: {
    id: number
    asana_access_token: string
  }
}

export async function postSimilarPullRequestsAsanaTaskComment(
  params: PostSimilarPullRequestsAsanaTaskCommentParams,
) {
  const { targetTask, organization, pullRequests } = params

  await postAsanaTaskComment({
    asanaAccessToken: organization.asana_access_token,
    extAsanaTaskId: targetTask.ext_asana_task_id,
    html: `<body>Here are some pull requests that could be similar to this task: <br/>${pullRequests.map((pullRequest) => `<a href="${pullRequest.html_url}">${pullRequest.title}</a>`).join('<br/>')}</body>`,
  })
}
