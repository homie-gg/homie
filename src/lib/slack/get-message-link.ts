import { SlackClient } from '@/lib/slack/create-slack-client'

interface GetMessageLinkParams {
  channelID: string
  messageTS: string
  slackClient: SlackClient
}

export async function getMessageLink(
  params: GetMessageLinkParams,
): Promise<string> {
  const { channelID, messageTS, slackClient } = params
  const res = await slackClient.get<{
    permalink: string
  }>(`chat.getPermalink?channel=${channelID}&message_ts=${messageTS}`)
  return res.permalink
}
