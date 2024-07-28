import { SlackClient } from '@/lib/slack/create-slack-client'
import { getSlackThreadMessages } from '@/lib/slack/get-slack-thread-messages'
import { TextMessageEvent } from '@/lib/slack/types'
import { MessageEvent } from '@slack/bolt'

interface GetAllTextMessagesParams {
  channelID: string
  messages: MessageEvent[]
  slackClient: SlackClient
}

export async function getAllTextMessages(
  params: GetAllTextMessagesParams,
): Promise<TextMessageEvent[]> {
  const { channelID, messages, slackClient } = params

  const result: TextMessageEvent[] = []

  for (const message of messages) {
    if (!!message.subtype) {
      continue
    }

    if ('reply_count' in message) {
      const textReplies = await getSlackThreadMessages({
        channelID: channelID,
        messageTS: message.ts,
        slackClient,
      })

      for (const reply of textReplies) {
        result.push(reply)
      }

      continue
    }

    if ('text' in message && !!message.text) {
      result.push({
        text: message.text,
        ts: message.ts,
      })
      continue
    }
  }

  return result
}
