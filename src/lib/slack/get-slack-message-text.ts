import { SlackClient } from '@/lib/slack/create-slack-client'
import { getSlackThreadMessages } from '@/lib/slack/get-slack-thread-messages'
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

  // If message is not a part of a thread, just return the text only
  if (!slackMessage.thread_ts) {
    return slackMessage.text
  }

  // If we're in a thread, we'll return the entire thread
  const threadMessages = await getSlackThreadMessages({
    channelID,
    messageTS,
    slackClient,
  })

  return threadMessages.join('\n')
}
