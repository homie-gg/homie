import { createSlackClient } from '@/lib/slack/create-slack-client'
import { dbClient } from '@/database/client'
import { SendPullRequestSummariesToOrganization } from '@/queue/jobs'
import { sendContributorPullRequests } from '@/lib/reporting/send-contributor-pull-requests'

export async function handleSendPullRequestSummariesToOrganization(
  job: SendPullRequestSummariesToOrganization,
) {
  const { organization } = job.data
  const { ext_slack_webhook_channel_id, slack_access_token } = organization
  const slackClient = createSlackClient(slack_access_token)

  const contributors = await dbClient
    .selectFrom('homie.contributor')
    .select(['id', 'ext_slack_member_id', 'username'])
    .where('organization_id', '=', organization.id)
    .execute()

  if (contributors.length === 0) {
    return
  }

  // Header
  await slackClient.post('chat.postMessage', {
    channel: ext_slack_webhook_channel_id,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Pull Requests Merged 🎉',
          emoji: true,
        },
      },
    ],
  })

  for (const contributor of contributors) {
    await sendContributorPullRequests({
      contributor,
      organization,
      slackClient,
    })
  }
}
