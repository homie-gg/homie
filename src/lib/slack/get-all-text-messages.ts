import { SlackClient } from '@/lib/slack/create-slack-client'
import { getTextReplies } from '@/lib/slack/get-text-replies'
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
      const textReplies = await getTextReplies({
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
      })
      continue
    }
  }

  return result
}
