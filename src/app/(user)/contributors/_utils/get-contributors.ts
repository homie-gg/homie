import { dbClient } from '@/database/client'
import { createSlackClient } from '@/lib/slack/create-slack-client'
import { getSlackDisplayName } from '@/lib/slack/get-slack-display-name'
import { getSlackUserProfile } from '@/lib/slack/get-slack-user-profile'
import { getSlackUsers } from '@/lib/slack/get-slack-users'
import { taskStatus } from '@/lib/tasks'
import { differenceInHours } from 'date-fns'

interface GetContributorsParams {
  organization: {
    id: number
    slack_access_token: string
  }
}

export type GetContributorsData = Array<{
  id: number
  openTaskCount: number
  realName?: string
  userName: string
  isActive: boolean
  timezone?: string
  hoursSinceLastPr: number
  extSlackMemberId: string
  image?: string
}>

export async function getContributors(
  params: GetContributorsParams,
): Promise<GetContributorsData> {
  const { organization } = params

  const slackClient = createSlackClient(organization.slack_access_token)

  const { members: slackMembers = [] } = await getSlackUsers({
    slackClient,
  })

  const availableSlackMembers = slackMembers
    .filter(
      (slackMember) =>
        // Is not bot
        slackMember.is_bot === false &&
        slackMember.id !== 'USLACKBOT' &&
        // Has name
        (Boolean(slackMember.profile?.display_name) ||
          Boolean(slackMember.profile?.real_name)),
    )
    .sort((a, b) =>
      getSlackDisplayName(a).localeCompare(getSlackDisplayName(b)),
    )

  const slackMemberIds: string[] = []
  for (const slackMember of availableSlackMembers) {
    if (slackMember.id) {
      slackMemberIds.push(slackMember.id)
    }
  }

  const contributors = await dbClient
    .selectFrom('homie.contributor')
    .where('organization_id', '=', organization.id)
    .select(['id', 'ext_slack_member_id', 'username'])
    .where('ext_slack_member_id', 'in', slackMemberIds)
    .execute()

  const slackContributors: Array<{
    id: number
    username: string
    ext_slack_member_id: string
  }> = []

  for (const contributor of contributors) {
    if (contributor.ext_slack_member_id) {
      slackContributors.push({
        id: contributor.id,
        username: contributor.username,
        ext_slack_member_id: contributor.ext_slack_member_id,
      })
    }
  }

  return (
    await Promise.all(
      slackContributors.map(async (contributor) => {
        const slackMember = availableSlackMembers.find(
          (slackMember) => slackMember.id === contributor.ext_slack_member_id,
        )

        if (!slackMember) {
          throw new Error(
            'Slack member not found. This should not happen as contributors should have been scoped to those with matching slack member ids.',
          )
        }

        const slackProfile = await getSlackUserProfile({
          slackClient,
          extSlackMemberId: contributor.ext_slack_member_id,
        })

        const openTasks =
          (await dbClient
            .selectFrom('homie.contributor_task')
            .innerJoin(
              'homie.task',
              'homie.task.id',
              'homie.contributor_task.task_id',
            )
            .where('homie.contributor_task.contributor_id', '=', contributor.id)
            .where('homie.task.task_status_id', '=', taskStatus.open)
            .execute()) ?? []

        const lastPullRequest = await dbClient
          .selectFrom('homie.pull_request')
          .where('contributor_id', '=', contributor.id)
          .orderBy('created_at', 'desc')
          .select(['created_at'])
          .limit(1)
          .executeTakeFirst()

        return {
          id: contributor.id,
          openTaskCount: openTasks.length,
          realName: slackMember.profile?.real_name,
          userName: contributor.username,
          isActive: !slackMember.deleted,
          timezone: slackMember.tz,
          hoursSinceLastPr: lastPullRequest
            ? differenceInHours(
                new Date(),
                new Date(lastPullRequest.created_at),
              )
            : 0,
          extSlackMemberId: contributor.ext_slack_member_id,
          image: slackProfile.image_192,
        }
      }),
    )
  ).filter((data) => Boolean(data))
}
