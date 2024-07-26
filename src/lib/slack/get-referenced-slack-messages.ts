import { createSlackClient } from '@/lib/slack/create-slack-client'
import { getSlackMessageConversation } from '@/lib/slack/get-slack-message-text'
import { getSlackThreadMessages } from '@/lib/slack/get-slack-thread-messages'
import { SlackMessage } from '@/lib/slack/types'

interface GetReferencedSlackMessagesParams {
  pullRequestBody: string | null
  organization: {
    id: number
    slack_access_token: string
  }
}

export async function getReferencedSlackMessages(
  params: GetReferencedSlackMessagesParams,
): Promise<string | null> {
  const { pullRequestBody, organization } = params
  if (!pullRequestBody) {
    return null
  }

  const slackClient = createSlackClient(organization.slack_access_token)

  const regex = `(slack.com\/archives\/)([^\/]*)\/(.*)$`

  const urlRegex = new RegExp(regex, 'gm') // array of URLs. e.g. ['slack.com/archives/foo/232', 'slack.com/archives/bar/123']

  const slackUrls = pullRequestBody?.match(urlRegex)

  if (!slackUrls || slackUrls?.length === 0) {
    return null
  }

  const results: SlackMessage[] = []
  for (const url of slackUrls) {
    const partsRegex = new RegExp(regex)

    const urlParts = url.match(partsRegex)

    if (!urlParts || urlParts?.length !== 4) {
      // Invalid URL
      continue
    }

    // Parse out channel ID and message TS (Slack identifier) via URL
    // Reference: https://stackoverflow.com/questions/46355373/get-a-messages-ts-value-from-archives-link

    const channelID = urlParts[2]

    const tsPart = urlParts[3]
    const tsString = tsPart.includes('?') ? tsPart.split('?')[0] : tsPart
    const ts = tsString // e.g. p1234567898000159
      .replaceAll(/[a-z]/g, '') // Remove any characters. e.g. 'p'
      .replace(/(.{10})/, '$1.') // Insert '.' af:ter 10th digit. e.g. 1234567898.000159

    const queryParams = tsPart.includes('?')
      ? new URLSearchParams(tsPart.split('?')[1])
      : new URLSearchParams()

    const threadTS = queryParams.get('thread_ts')

    if (threadTS) {
      const threadMessages = await getSlackThreadMessages({
        channelID,
        messageTS: threadTS,
        slackClient,
      })

      const message = threadMessages
        .filter((threadMessage) => !!threadMessage.text)
        .map((threadMessage) => threadMessage.text)
        .join('\n')

      results.push({
        channelID,
        ts,
        message,
      })
      continue
    }

    const message = await getSlackMessageConversation({
      slackClient,
      channelID,
      messageTS: ts,
    })

    if (!message) {
      continue
    }

    results.push({
      channelID,
      ts,
      message,
    })
  }

  if (results.length === 0) {
    return null
  }

  // Merge all slack referenced URLs into a single message context
  return results.map((message) => message.message).join('\n')
}
