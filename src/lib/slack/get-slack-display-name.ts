import { Member as SlackMember } from '@slack/web-api/dist/response/UsersListResponse'

export function getSlackDisplayName(slackMember: SlackMember) {
  if (slackMember.profile?.display_name) {
    return slackMember.profile.display_name
  }

  if (slackMember.profile?.real_name) {
    return slackMember.profile.real_name
  }

  return 'Unknown'
}
