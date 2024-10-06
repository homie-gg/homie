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
import { getAssignTaskToContributorTool } from '@/lib/ai/chat/tools/get-assign-task-to-contributor-tool'
import { getMarkTaskAsDoneTool } from '@/lib/ai/chat/tools/get-mark-task-as-done-tool'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { getCreateTaskTool } from '@/lib/ai/chat/tools/get-create-task-tool'
import { DynamicStructuredTool } from '@langchain/core/tools'
import { z } from 'zod'
import { getFindAnswerAgent } from '@/lib/ai/chat/agents/get-find-answer-agent'

interface getManageTasksTool {
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
  channelID: string
  messageId: string
  slackMessage: Message
}

export function getManageTasksAgent(params: getManageTasksTool) {
  const { organization, slackMessage, channelID, messageId } = params

  return new DynamicStructuredTool({
    name: 'manage_tasks',
    description: 'Perform actions to manage project tasks',
    schema: z.object({
      instructions: z
        .string()
        .describe('What action to perform on project tasks'),
    }),
    func: async (params) => {
      const { instructions } = params

      logger.debug('Manage tasks', {
        event: 'manage_tasks:call',
        message_id: messageId,
        organization: getOrganizationLogData(organization),
      })

      const tools = [
        getFindAnswerAgent({
          organization,
          messageId,
        }),
        getAssignTaskToContributorTool({
          organization,
          answerId: messageId,
        }),
        getMarkTaskAsDoneTool({
          organization,
          answerId: messageId,
        }),
        getCreateTaskTool({
          organization,
          answerId: messageId,
          targetMessageTS: slackMessage.ts,
          channelID,
        }),
      ]

      const model = createOpenAIChatClient({ model: 'gpt-4o-2024-05-13' })
      const modelWithFunctions = model.bind({
        functions: tools.map((tool) => convertToOpenAIFunction(tool)),
      })

      const currentDate = new Date().toISOString()

      const prompt = ChatPromptTemplate.fromMessages([
        ['system', 'You are helpful project manager.'],
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
        input: instructions,
      })

      return result.output
    },
  })
}
