import { SlackClient } from '@/lib/slack/create-slack-client'
import { ConversationsHistoryResponse } from '@slack/web-api/dist/response'

interface getSlackMessageConversationParams {
  slackClient: SlackClient
  channelID: string
  messageTS: string
}

export async function getSlackMessageConversation(
  params: getSlackMessageConversationParams,
): Promise<string | null> {
  const { slackClient, channelID, messageTS } = params
  const history = await slackClient.post<ConversationsHistoryResponse>(
    'conversations.history',
    {
      channel: channelID, // same channel
      latest: messageTS, // start from target message
      inclusive: true, // include the target message
      limit: 1, // only want target message
    },
  )

  if (history.messages?.length === 0) {
    return null
  }

  const slackMessage = history.messages?.[0]
  if (!slackMessage) {
    return null
  }

  if (!slackMessage.text) {
    return null
  }

  return slackMessage.text
}
