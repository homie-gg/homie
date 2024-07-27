import { createSlackClient } from '@/lib/slack/create-slack-client'
import { SlackLink } from '@/lib/slack/get-slack-links'

interface SendSlackPRMergedMessageParams {
  slackLink: SlackLink
  pullRequest: {
    title: string
    htmlUrl: string
  }
  organization: {
    slack_access_token: string
  }
}

export async function sendSlackPRMergedMessage(
  params: SendSlackPRMergedMessageParams,
) {
  const { slackLink, pullRequest, organization } = params

  const slackClient = createSlackClient(organization.slack_access_token)

  await slackClient.post('chat.postMessage', {
    channel: slackLink.channelID,
    thread_ts: slackLink.threadTS || slackLink.messageTS,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Pull Request referencing this message has been merged 🍕.',
          emoji: true,
        },
      },
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_quote',
            elements: [
              {
                type: 'text',
                text: '\n',
              },
              {
                type: 'link',
                url: pullRequest.htmlUrl,
                text: pullRequest.title,
              },
            ],
          },
        ],
      },
    ],
  })
}
