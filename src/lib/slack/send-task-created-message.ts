import { SlackClient } from '@/lib/slack/create-slack-client'

interface SendTaskCreatedMessageParams {
  slackClient: SlackClient
  channelID: string
  threadTS: string
  message: string
  title: string
  description: string
  url: string
}

export async function sendTaskCreatedMessage(
  params: SendTaskCreatedMessageParams,
) {
  const { slackClient, channelID, threadTS, message, title, description, url } =
    params

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
                text: message,
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
              {
                type: 'text',
                text: description,
              },
            ],
          },
        ],
      },
    ],
  })
}
