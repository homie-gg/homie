import { SlackClient } from '@/lib/slack/create-slack-client'
import { ConversationsRepliesResponse } from '@slack/web-api/dist/response'

interface GetSlackThreadMessages {
  channelID: string
  messageTS: string
  slackClient: SlackClient
}

type TextMessageEvent = {
  text: string
  user?: string
  ts: string
}

export async function getSlackThreadMessages(
  params: GetSlackThreadMessages,
): Promise<TextMessageEvent[]> {
  const { channelID, messageTS, slackClient } = params
  const replies = await slackClient.get<ConversationsRepliesResponse>(
    `conversations.replies?channel=${channelID}&ts=${messageTS}`,
  )

  const textMessages: TextMessageEvent[] = []

  if (!replies.messages) {
    return []
  }

  for (const message of replies.messages) {
    if (!message.ts) {
      continue
    }

    if ('text' in message && !!message.text) {
      textMessages.push({
        text: message.text,
        user: message.user,
        ts: message.ts,
      })
    }
  }

  return textMessages
}
