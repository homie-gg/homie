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
import { getSearchGeneralContextTool } from '@/lib/ai/chat/tools/get-search-context-tool'
import { rephraseWithPersona } from '@/lib/ai/rephrase-with-persona'
import { getListPullRequestsTool } from '@/lib/ai/chat/tools/get-list-pull-requests-tool'
import { getTodaysDateTool } from '@/lib/ai/chat/tools/get-todays-date-tool'
import { getRememberConversationTool } from '@/lib/ai/chat/tools/get-remember-conversation-tool'
import { Message } from '@/lib/ai/chat/types'
import { getFindOpenTasksTool } from '@/lib/ai/chat/tools/get-find-open-tasks-tool'
import { getFindCompletedTasksTool } from '@/lib/ai/chat/tools/get-find-completed-tasks-tool'

interface GetAnswerParams {
  organization: {
    id: number
    is_persona_enabled: boolean
    persona_positivity_level: number
    persona_g_level: number
    persona_affection_level: number
    persona_emoji_level: number
    slack_access_token: string
  }
  messages: Message[]
  channelID: string
}

export async function getAnswer(params: GetAnswerParams): Promise<string> {
  const { organization, messages, channelID } = params

  const currentMessage = messages.pop()

  if (!currentMessage) {
    return 'Message was provided.'
  }

  const tools = [
    getSearchGeneralContextTool({
      organization,
    }),
    getListPullRequestsTool({
      organization,
    }),
    getTodaysDateTool(),
    getRememberConversationTool({
      targetMessageTS: currentMessage.ts,
      organization,
      messages,
      channelID: channelID,
    }),
    getFindOpenTasksTool({
      organization,
    }),
    getFindCompletedTasksTool({
      organization,
    }),
  ]

  const model = createOpenAIChatClient({ model: 'gpt-4o' })
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

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are helpful project manager.'],
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

  const answer = result.output

  if (organization.is_persona_enabled) {
    return rephraseWithPersona({
      affectionLevel: organization.persona_affection_level,
      gLevel: organization.persona_g_level,
      emojiLevel: organization.persona_emoji_level,
      positivityLevel: organization.persona_positivity_level,
      text: answer,
    })
  }

  return answer
}
