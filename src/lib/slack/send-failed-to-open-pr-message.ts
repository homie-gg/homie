import { SlackClient } from '@/lib/slack/create-slack-client'

interface sendFailedToOpenPRMessageParams {
  slackClient: SlackClient
  channelID: string
  threadTS: string
}

export async function sendFailedToOpenPRMessage(
  params: sendFailedToOpenPRMessageParams,
) {
  const { slackClient, channelID, threadTS } = params
  return await slackClient.post('chat.postMessage', {
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
                text: "Sorry, something went wrong and we couldn't create PR for this.",
              },
            ],
          },
        ],
      },
    ],
  })
}
