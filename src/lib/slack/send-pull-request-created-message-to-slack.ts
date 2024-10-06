import { SlackClient } from '@/lib/slack/create-slack-client'

interface SendPullRequestCreatedMessageToSlack {
  slackClient: SlackClient
  channelID: string
  threadTS: string
  title: string
  url: string
}

export async function sendPullRequestCreatedMessageToSlack(
  params: SendPullRequestCreatedMessageToSlack,
) {
  const { slackClient, channelID, threadTS, title, url } = params

  await slackClient.post('chat.postMessage', {
    channel: channelID,
    thread_ts: threadTS,
    blocks: [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_quote',
            elements: [
              {
                type: 'text',
                text: 'Pull Request has been created',
                style: {
                  bold: true,
                },
              },
              {
                type: 'text',
                text: '\n',
              },
              {
                type: 'link',
                url: url,
                text: title,
              },
              {
                type: 'text',
                text: '\n',
              },
            ],
          },
        ],
      },
    ],
  })
}
