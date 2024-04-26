import { SlackClient } from '@/lib/slack/create-slack-client'
import { dbClient } from '@/database/client'
import { getPullRequestCutoffDate } from '@/lib/reporting/get-pull-request-cut-off-date'
import {
  ChatPostMessageArguments,
  RichTextBlock,
} from '@slack/web-api/dist/methods'

interface SendContributorPullRequestsParams {
  contributor: {
    id: number
    username: string
    ext_slack_member_id: string | null
  }
  organization: {
    id: number
    ext_slack_webhook_channel_id: string
    send_pull_request_summaries_interval: string
    send_pull_request_summaries_day: string
    send_pull_request_summaries_time: string
  }
  slackClient: SlackClient
}

export async function sendContributorPullRequests(
  params: SendContributorPullRequestsParams,
) {
  const { contributor, organization, slackClient } = params

  const cutOffDate = getPullRequestCutoffDate({ organization })

  const blocks: ChatPostMessageArguments['blocks'] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: contributor.ext_slack_member_id
          ? `<@${contributor.ext_slack_member_id}>`
          : contributor.username,
      },
    },
  ]

  const repos = await dbClient
    .selectFrom('github.repo')
    .select(['name', 'id', 'html_url'])
    .where('github.repo.organization_id', '=', organization.id)
    .execute()

  for (const repo of repos) {
    const pullRequests = await dbClient
      .selectFrom('github.pull_request')
      .where('contributor_id', '=', contributor.id)
      .where('repo_id', '=', repo.id)
      .where('merged_at', 'is not', null)
      .where('created_at', '>', cutOffDate)
      .select(['github.pull_request.html_url', 'github.pull_request.title'])
      .orderBy('merged_at')
      .execute()

    if (pullRequests.length === 0) {
      continue
    }

    const elements: RichTextBlock['elements'] = []

    // Repo header
    elements.push({
      type: 'rich_text_list',
      style: 'bullet',
      indent: 0,
      border: 0,
      elements: [
        {
          type: 'rich_text_section',
          elements: [
            {
              type: 'link',
              url: repo.html_url,
              text: repo.name,
              style: {
                bold: true,
              },
            },
          ],
        },
      ],
    })

    // Pull requests
    elements.push({
      type: 'rich_text_list',
      style: 'bullet',
      indent: 1,
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
    })

    blocks.push({
      type: 'rich_text',
      elements,
    })
  }

  await slackClient.post('chat.postMessage', {
    channel: organization.ext_slack_webhook_channel_id,
    blocks,
  })
}
