import { SlackClient } from '@/lib/api/slack/create-slack-client'
import { Conversation } from '@/lib/slack/types'

interface GetTextRepliesParams {
  channelID: string
  messageTS: string
  slackClient: SlackClient
}

type TextMessageEvent = {
  text: string
}

export async function getTextReplies(
  params: GetTextRepliesParams,
): Promise<TextMessageEvent[]> {
  const { channelID, messageTS, slackClient } = params
  const replies: Conversation = await slackClient.get(
    `conversations.replies?channel=${channelID}&ts=${messageTS}`,
  )

  const textMessages: TextMessageEvent[] = []

  for (const message of replies.messages) {
    if ('text' in message && !!message.text) {
      textMessages.push({
        text: message.text,
      })
    }
  }

  return textMessages
}
