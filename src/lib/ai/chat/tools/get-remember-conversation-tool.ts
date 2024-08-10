import { Message } from '@/lib/ai/chat/types'
import { embedSlackConversation } from '@/lib/ai/embed-slack-conversation'
import { summarizeConversation } from '@/lib/ai/summarize-conversation'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { createSlackClient } from '@/lib/slack/create-slack-client'
import { getConversation } from '@/lib/slack/get-conversation'
import { getMessageLink } from '@/lib/slack/get-message-link'
import { zodFunction } from 'openai/helpers/zod.mjs'
import { z } from 'zod'

interface getRememberConversationToolParams {
  targetMessageTS: string
  organization: {
    id: number
    slack_access_token: string
  }
  channelID: string
  messages: Message[]
  answerId: string
}

export function getRememberConversationTool(
  params: getRememberConversationToolParams,
) {
  const { targetMessageTS, organization, messages, channelID, answerId } =
    params

  return zodFunction({
    name: 'remember_conversation',
    description: 'Remember or bookmark a conversation',
    parameters: z.object({
      todaysDate: z.string().describe('The date today'),
    }),
    function: async ({ todaysDate }) => {
      logger.debug('Call - Remember Conversation', {
        event: 'get_answer:remember_conversation:call',
        answer_id: answerId,
        organization: getOrganizationLogData(organization),
        todays_date: todaysDate,
      })

      try {
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
          messageUrl: slackMessageUrl,
          summary,
          savedAt: todaysDate,
          organization,
        })

        logger.debug('Finished remembering conversation', {
          event: 'get_answer:remember_conversation:done',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          todays_date: todaysDate,
          conversation,
          summary,
        })

        return 'Done, saved successfully.'
      } catch (error) {
        logger.debug('Failed to remember conversation', {
          event: 'get_answer:remember_conversation:failed',
          answer_id: answerId,
          organization: getOrganizationLogData(organization),
          todays_date: todaysDate,
          error,
        })

        return 'FAILED'
      }
    },
  })
}
