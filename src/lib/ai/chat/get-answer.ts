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

interface Message {
  type: 'human' | 'bot'
  content: string
}

interface GetAnswerParams {
  organization: {
    id: number
    is_persona_enabled: boolean
    persona_positivity_level: number
    persona_g_level: number
    persona_affection_level: number
    persona_emoji_level: number
  }
  messages: Message[]
}

export async function getAnswer(params: GetAnswerParams): Promise<string> {
  const { organization, messages } = params

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
  ]

  const model = createOpenAIChatClient({ model: 'gpt-4o' })
  const modelWithFunctions = model.bind({
    functions: tools.map((tool) => convertToOpenAIFunction(tool)),
  })

  const chatHistory: BaseMessage[] = messages.map((message) => {
    switch (message.type) {
      case 'bot':
        return new SystemMessage({ content: message.content })
      case 'human':
        return new HumanMessage({
          content: message.content,
        })
    }
  })

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'You are help project manager.'],
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
    input: currentMessage.content,
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
