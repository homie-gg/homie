import { SlackClient } from '@/lib/slack/create-slack-client'
import { type Profile } from '@slack/web-api/dist/response/UsersListResponse'

interface GetSlackUserProfileParams {
  slackClient: SlackClient
  extSlackMemberId: string
}

interface GetSlackUserProfileResponse {
  display_name?: string
  real_name?: string
  image_48?: string
  image_72?: string
  image_192?: string
  image_512?: string
}

export async function getSlackUserProfile(
  params: GetSlackUserProfileParams,
): Promise<GetSlackUserProfileResponse> {
  const { slackClient, extSlackMemberId } = params
  return slackClient.get<Profile>(`users.profile.get?user=${extSlackMemberId}`)
}
