import { RunnableSequence } from '@langchain/core/runnables'
import { AgentExecutor } from 'langchain/agents'
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts'
import { formatToOpenAIFunctionMessages } from 'langchain/agents/format_scratchpad'
import { OpenAIFunctionsAgentOutputParser } from 'langchain/agents/openai/output_parser'
import { createOpenAIChatClient } from '@/lib/open-ai/create-open-ai-chat-client'
import { convertToOpenAIFunction } from '@langchain/core/utils/function_calling'
import { Message } from '@/lib/ai/chat/types'
import { v4 as uuid } from 'uuid'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { getWriteCodeTool } from '@/lib/ai/chat/tools/get-write-code-tool'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { getFindAnswerAgent } from '@/lib/ai/chat/agents/get-find-answer-agent'

interface GetWriteCodeAgent {
  organization: {
    id: number
    is_persona_enabled: boolean
    persona_positivity_level: number
    persona_g_level: number
    persona_affection_level: number
    persona_emoji_level: number
    slack_access_token: string
    ext_gh_install_id: number | null
    trello_access_token: string | null
    asana_access_token: string | null
    ext_trello_new_task_list_id: string | null
    ext_trello_done_task_list_id: string | null
  }
  slackChannelID: string
  slackMessage: Message
  messageId: string
}

export function getWriteCodeAgent(params: GetWriteCodeAgent) {
  const { organization, slackChannelID, slackMessage, messageId } = params

  return new DynamicStructuredTool({
    name: 'write_code_agent',
    description: 'Writes code to implement features or bug fixes.',
    schema: z.object({
      requirements: z
        .string()
        .describe(
          'Requirements that describe the bug fix or feature that the code should do.',
        ),
    }),
    func: async (params) => {
      const { requirements } = params

      const answerId = uuid()
      logger.debug('Write code', {
        event: 'write_code:call',
        message_id: messageId,
        organization: getOrganizationLogData(organization),
      })

      const tools = [
        getFindAnswerAgent({
          organization,
          messageId,
        }),
        getWriteCodeTool({
          slackTargetMessageTS: slackMessage.ts,
          organization,
          answerId,
          slackChannelID: slackChannelID,
        }),
      ]

      const model = createOpenAIChatClient({ model: 'gpt-4o-2024-05-13' })
      const modelWithFunctions = model.bind({
        functions: tools.map((tool) => convertToOpenAIFunction(tool)),
      })

      const currentDate = new Date().toISOString()

      const prompt = ChatPromptTemplate.fromMessages([
        ['system', 'You are a software egnineer.'],
        ['system', `The current date is ${currentDate}`],
        new MessagesPlaceholder('chat_history'),
        ['user', '{input}'],
        new MessagesPlaceholder('agent_scratchpad'),
      ])

      const agent = RunnableSequence.from([
        {
          input: (i) => i.input,
          agent_scratchpad: (i) => formatToOpenAIFunctionMessages(i.steps),
          chat_history: (i) => i.chat_history,
        },
        prompt,
        modelWithFunctions,
        new OpenAIFunctionsAgentOutputParser(),
      ])

      const executor = AgentExecutor.fromAgentAndTools({
        agent,
        tools,
      })

      const result = await executor.invoke({
        input: requirements,
      })

      logger.debug('Finished writing code', {
        event: 'write_code:result',
        message_id: messageId,
        organization: getOrganizationLogData(organization),
        requirements,
        result: result.output,
      })

      return result.output
    },
  })
}
