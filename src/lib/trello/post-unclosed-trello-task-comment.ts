import { getGreeting } from '@/lib/ai/get-greeting'
import { createTrelloClient } from '@/lib/trello/create-trello-client'

interface PostUnclosedTrelloTaskCommentParams {
  task: {
    ext_trello_card_id: string
  }
  pullRequest: {
    title: string
    html_url: string
  }
  organization: {
    id: number
    trello_access_token: string
  }
}

export async function postUnclosedTrelloTaskComment(
  params: PostUnclosedTrelloTaskCommentParams,
) {
  const { task, organization, pullRequest } = params

  const trelloClient = createTrelloClient(organization.trello_access_token)

  const text = `${getGreeting()}, this might have already been done via: [${pullRequest.title}](${pullRequest.html_url}).`

  await trelloClient.post(
    `/cards/${task.ext_trello_card_id}/actions/comments?text=${text}`,
    {},
  )
}
