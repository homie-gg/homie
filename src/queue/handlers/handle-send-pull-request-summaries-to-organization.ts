import { createSlackClient } from '@/lib/api/slack/create-slack-client'
import { dbClient } from '@/lib/db/client'
import { SendPullRequestSummariesToOrganization } from '@/queue/jobs'
import { subDays } from 'date-fns'

export async function handleSendPullRequestSummariesToOrganization(
  job: SendPullRequestSummariesToOrganization,
) {
  const { organization } = job.data
  const { ext_slack_webhook_channel_id, slack_access_token } = organization
  const slackClient = createSlackClient(slack_access_token)

  const cutOffDate = getPullRequestCutOffDate(organization)

  const contributors = await dbClient
    .selectFrom('voidpm.contributor')
    .select(['id', 'ext_slack_member_id', 'username'])
    .where('organization_id', '=', organization.id)
    .where('created_at', '>', cutOffDate)
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
    const pullRequests = await dbClient
      .selectFrom('github.pull_request')
      .where('contributor_id', '=', contributor.id)
      .selectAll()
      .execute()

    await slackClient.post('chat.postMessage', {
      channel: ext_slack_webhook_channel_id,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: contributor.ext_slack_member_id
              ? `<@${contributor.ext_slack_member_id}>`
              : contributor.username,
          },
        },
        {
          type: 'rich_text',
          elements: [
            {
              type: 'rich_text_list',
              style: 'bullet',
              indent: 0,
              border: 0,
              elements: pullRequests.map((pullRequest) => ({
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'link',
                    url: pullRequest.html_url,
                    text: pullRequest.title,
                  },
                ],
              })),
              // elements: [
              //   {
              //     type: 'rich_text_section',
              //     elements: ,
              //     // elements: [
              //     //   {
              //     //     type: 'link',
              //     //     url: 'https://slack.com/',
              //     //     text: 'with a link',
              //     //     style: {
              //     //       bold: true,
              //     //     },
              //     //   },
              //     // ],
              //   },
              // ],
            },
          ],
        },
      ],
    })
  }
}

function getPullRequestCutOffDate(organization: {
  send_pull_request_summaries_interval: string
  send_pull_request_summaries_day: string
  send_pull_request_summaries_time: string
}) {
  const { send_pull_request_summaries_interval } = organization

  if (send_pull_request_summaries_interval === 'daily') {
    return subDays(new Date(), 1)
  }

  return subDays(new Date(), 7)
}
