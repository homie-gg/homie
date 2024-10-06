import { RunnableSequence } from '@langchain/core/runnables'
import { AgentExecutor } from 'langchain/agents'
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts'
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages'
import { formatToOpenAIFunctionMessages } from 'langchain/agents/format_scratchpad'
import { OpenAIFunctionsAgentOutputParser } from 'langchain/agents/openai/output_parser'
import { createOpenAIChatClient } from '@/lib/open-ai/create-open-ai-chat-client'
import { convertToOpenAIFunction } from '@langchain/core/utils/function_calling'
import { rephraseWithPersona } from '@/lib/ai/rephrase-with-persona'
import { Message } from '@/lib/ai/chat/types'
import { v4 as uuid } from 'uuid'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { getRememberConversationTool } from '@/lib/ai/chat/tools/get-remember-conversation-tool'
import { getFindAnswerAgent } from '@/lib/ai/chat/agents/get-find-answer-agent'
import { getManageTasksAgent } from '@/lib/ai/chat/agents/get-manage-tasks-agent'
import { getWriteCodeAgent } from '@/lib/ai/chat/agents/get-write-code-agent'

interface GetReplyParams {
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
  messages: Message[]
  slackChannelID: string
}

export async function getReply(params: GetReplyParams): Promise<string> {
  const { organization, messages, slackChannelID } = params

  const currentMessage = messages.pop()

  if (!currentMessage) {
    return 'No message was provided.'
  }

  const messageId = uuid()

  logger.debug('Reply message', {
    event: 'reply_message:call',
    message_id: messageId,
    organization: getOrganizationLogData(organization),
  })

  const tools = [
    getRememberConversationTool({
      targetMessageTS: currentMessage.ts,
      organization,
      messages,
      channelID: slackChannelID,
      messageId,
    }),
    getFindAnswerAgent({
      organization,
      messageId,
    }),
    getManageTasksAgent({
      organization,
      channelID: slackChannelID,
      messageId,
      slackMessage: currentMessage,
    }),
    getWriteCodeAgent({
      organization,
      messageId,
      slackMessage: currentMessage,
      slackChannelID: slackChannelID,
    }),
  ]

  const model = createOpenAIChatClient({ model: 'gpt-4o-2024-05-13' })
  const modelWithFunctions = model.bind({
    functions: tools.map((tool) => convertToOpenAIFunction(tool)),
  })

  const chatHistory: BaseMessage[] = messages.map((message) => {
    switch (message.type) {
      case 'bot':
        return new SystemMessage({ content: message.text })
      case 'human':
        return new HumanMessage({
          content: message.text,
        })
    }
  })

  const currentDate = new Date().toISOString()

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are helpful project manager on a software team.'],
    ['system', `The current date is ${currentDate}`],
    ['system', 'Always include URL links if available.'],
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
    input: currentMessage.text,
    chat_history: chatHistory,
  })

  const reply = result.output

  logger.debug('Got reply', {
    event: 'reply_message:result',
    answer_id: messageId,
    organization: getOrganizationLogData(organization),
    input: currentMessage.text,
    reply,
  })

  if (organization.is_persona_enabled) {
    return rephraseWithPersona({
      affectionLevel: organization.persona_affection_level,
      gLevel: organization.persona_g_level,
      emojiLevel: organization.persona_emoji_level,
      positivityLevel: organization.persona_positivity_level,
      text: reply,
    })
  }

  return reply
}
