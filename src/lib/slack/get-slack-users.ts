import { SlackClient } from '@/lib/api/slack/create-slack-client'
import {
  type UsersListResponse,
  type Member,
} from '@slack/web-api/dist/response/UsersListResponse'

interface GetSlackUsersParams {
  slackClient: SlackClient
}

interface GetSlackUsersResponse {
  ok: boolean
  members?: Member[] | undefined
}

export async function getSlackUsers(
  params: GetSlackUsersParams,
): Promise<GetSlackUsersResponse> {
  const { slackClient } = params

  try {
    return await slackClient.get<UsersListResponse>('users.list')
  } catch {
    return {
      ok: false,
      members: [],
    }
  }
}
