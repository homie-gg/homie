import { createTrelloClient } from '@/lib/trello/create-trello-client'
import { TrelloMember } from '@/lib/trello/types'

interface GetTrelloBoardMembersParams {
  boardId: string
  accessToken: string
}

export async function getTrelloBoardMembers(
  params: GetTrelloBoardMembersParams,
): Promise<TrelloMember[]> {
  const { accessToken, boardId } = params
  const trelloClient = createTrelloClient(accessToken)
  return trelloClient.get(`/boards/${boardId}/members`)
}
