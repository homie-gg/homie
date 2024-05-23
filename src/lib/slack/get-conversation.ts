import { SlackClient } from '@/lib/slack/create-slack-client'
import { getAllTextMessages } from '@/lib/slack/get-all-text-messages'
import { Conversation } from '@/lib/slack/types'

interface GetConversationParams {
  slackClient: SlackClient
  messageTS: string
  channelID: string
  includeBotReplies?: boolean
}

export async function getConversation(params: GetConversationParams) {
  const { slackClient, messageTS, channelID, includeBotReplies = true } = params

  const history = await slackClient.post<Conversation>(
    'conversations.history',
    {
      channel: channelID, // same channel
      latest: messageTS, // start from target message
      inclusive: true, // include the target message
      limit: 30, // include the previous 30 messages for context
    },
  )

  if (history.messages.length === 0) {
    return []
  }

  const messages = includeBotReplies
    ? history.messages
    : history.messages.filter((message) => !('bot_profile' in message))

  return getAllTextMessages({
    channelID,
    messages,
    slackClient,
  })
}
