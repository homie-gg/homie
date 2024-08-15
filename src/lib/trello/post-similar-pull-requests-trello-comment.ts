import { createTrelloClient } from '@/lib/trello/create-trello-client'

interface PostSimilarPullRequestsTrelloTaskCommentParams {
  targetTask: {
    ext_trello_card_id: string
  }
  pullRequests: Array<{ id: number; title: string; html_url: string }>
  organization: {
    id: number
    trello_access_token: string
  }
}

export async function postSimilarPullRequestsTrelloTaskComment(
  params: PostSimilarPullRequestsTrelloTaskCommentParams,
) {
  const { targetTask, organization, pullRequests } = params

  const trelloClient = createTrelloClient(organization.trello_access_token)

  const text = `Here are some pull requests that might be helpful reference for this task:\n${pullRequests.map((pullRequest) => `- [${pullRequest.title}](${pullRequest.html_url})`).join('\n')}`

  await trelloClient.post(
    `/cards/${targetTask.ext_trello_card_id}/actions/comments?text=${text}`,
    {},
  )
}
