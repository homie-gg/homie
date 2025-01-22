import { dbClient } from '@/database/client'
import { SlackClient, createSlackClient } from '@/lib/slack/create-slack-client'
import { getSlackUserProfile } from '@/lib/slack/get-slack-user-profile'

interface GetContributorDetailsParams {
  organization: {
    id: number
    slack_access_token: string
  }
  contributorId: string
  days: number
}

export interface GetContributorDetailsData {
  contributor: {
    username: string
    id: number
    ext_slack_member_id: string
  }
  slackMember: Awaited<ReturnType<typeof getSlackUserProfile>>
}

export async function getContributorDetails(
  params: GetContributorDetailsParams,
) {
  const { organization, contributorId } = params

  const contributor = await dbClient
    .selectFrom('homie.contributor')
    .innerJoin(
      'homie.organization',
      'homie.organization.id',
      'homie.contributor.organization_id',
    )
    .where('homie.organization.ext_clerk_user_id', '=', contributorId)
    .select(['username', 'id', 'ext_slack_member_id'])
    .executeTakeFirst()

  if (!contributor) {
    return null
  }

  const slackClient = createSlackClient(organization.slack_access_token)

  const slackMember = await tryGetSlackUserProfile({
    slackClient,
    extSlackMemberId: contributor.ext_slack_member_id,
  })

  return {
    contributor,
    slackMember,
  }
}

async function tryGetSlackUserProfile(params: {
  slackClient: SlackClient
  extSlackMemberId: string | null
}) {
  const { slackClient, extSlackMemberId } = params

  if (!extSlackMemberId) {
    return null
  }

  try {
    return getSlackUserProfile({
      slackClient,
      extSlackMemberId: extSlackMemberId,
    })
  } catch (error) {
    return null
  }
}
