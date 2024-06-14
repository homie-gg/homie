import { Message } from '@/lib/ai/chat/types'
import { embedSlackConversation } from '@/lib/ai/embed-slack-conversation'
import { summarizeConversation } from '@/lib/ai/summarize-conversation'
import { createSlackClient } from '@/lib/slack/create-slack-client'
import { getConversation } from '@/lib/slack/get-conversation'
import { getMessageLink } from '@/lib/slack/get-message-link'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'

interface getRememberConversationToolParams {
  targetMessageTS: string
  organization: {
    id: number
    slack_access_token: string
  }
  channelID: string
  messages: Message[]
}

export function getRememberConversationTool(
  params: getRememberConversationToolParams,
) {
  const { targetMessageTS, organization, messages, channelID } = params
  return new DynamicStructuredTool({
    name: 'remember_conversation',
    description: 'Remember or bookmark a conversation',
    schema: z.object({
      todaysDate: z.coerce.date().describe('The date today'),
    }),
    func: async ({ todaysDate }) => {
      const slackClient = createSlackClient(organization.slack_access_token)

      const conversation =
        messages.length > 1
          ? messages
          : await getConversation({
              slackClient,
              messageTS: targetMessageTS,
              channelID,
            })

      const slackMessageUrl = await getMessageLink({
        channelID,
        messageTS: messages[0].ts,
        slackClient,
      })

      const summary = await summarizeConversation({ messages: conversation })

      await embedSlackConversation({
        metadata: {
          type: 'conversation',
          organization_id: organization.id,
        },
        messageUrl: slackMessageUrl,
        summary,
        savedAt: todaysDate,
      })

      return 'Done, saved successfully.'
    },
  })
}
