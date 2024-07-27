import { createSlackClient } from '@/lib/slack/create-slack-client'
import { getSlackLinks } from '@/lib/slack/get-slack-links'
import { getSlackMessageConversation } from '@/lib/slack/get-slack-message-text'
import { getSlackThreadMessages } from '@/lib/slack/get-slack-thread-messages'

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

  const slackLinks = getSlackLinks({ pullRequestBody })

  const messages = await Promise.all(
    slackLinks.map(async (slackLink) => {
      if (slackLink.threadTS) {
        const threadMessages = await getSlackThreadMessages({
          channelID: slackLink.channelID,
          messageTS: slackLink.threadTS,
          slackClient,
        })

        return threadMessages
          .filter((threadMessage) => !!threadMessage.text)
          .map((threadMessage) => threadMessage.text)
          .join('\n')
      }

      return getSlackMessageConversation({
        slackClient,
        channelID: slackLink.channelID,
        messageTS: slackLink.messageTS,
      })
    }),
  )

  return messages.filter((message) => !!message).join('\n')
}
