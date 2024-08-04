import { getGreeting } from '@/lib/ai/get-greeting'
import { postAsanaTaskComment } from '@/lib/asana/post-asana-task-comment'
import { createTrelloClient } from '@/lib/trello/create-trello-client'

interface PostPotentialDuplicateTrelloTaskCommentParams {
  targetTask: {
    ext_trello_card_id: string
  }
  duplicateTask: {
    name: string
    html_url: string
  }
  organization: {
    id: number
    trello_access_token: string
  }
}

export async function postPotentialDuplicateTrelloTaskComment(
  params: PostPotentialDuplicateTrelloTaskCommentParams,
) {
  const { targetTask, organization, duplicateTask } = params

  const trelloClient = createTrelloClient(organization.trello_access_token)

  const text = `${getGreeting()}, this might be a duplicate of: [${duplicateTask.name}](${duplicateTask.html_url}).`

  await trelloClient.post(
    `/cards/${targetTask.ext_trello_card_id}/actions/comments?text=${text}`,
    {},
  )
}
