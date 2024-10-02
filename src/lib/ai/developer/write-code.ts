import { RunnableSequence } from '@langchain/core/runnables'
import { formatXml } from 'langchain/agents/format_scratchpad/xml'
import { XMLAgentOutputParser } from 'langchain/agents/xml/output_parser'
import { AgentExecutor } from 'langchain/agents'
import {
  ChatPromptTemplate,
  MessagesPlaceholder,
} from '@langchain/core/prompts'
import { AIMessage, BaseMessage, HumanMessage } from '@langchain/core/messages'
import { Message } from '@/lib/ai/chat/types'
import { v4 as uuid } from 'uuid'
import { createAnthropicChatClient } from '@/lib/anthropic/create-anthropic-chat-client'

interface WriteCodeParams {
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
  channelID: string
}

export async function writeCode(params: WriteCodeParams): Promise<string> {
  const { organization, messages, channelID } = params

  const currentMessage = messages.pop()

  if (!currentMessage) {
    return 'Message was provided.'
  }

  const model = createAnthropicChatClient({
    model: 'claude-3-5-sonnet-20240620',
  })

  const chatHistory: BaseMessage[] = messages.map((message) => {
    switch (message.type) {
      case 'bot':
        return new AIMessage({ content: message.text })
      case 'human':
        return new HumanMessage({
          content: message.text,
        })
    }
  })

  const prompt = ChatPromptTemplate.fromMessages([
    ['system', 'you are a senior software engineer'],
    new MessagesPlaceholder('chat_history'),
    ['human', '{input}'],
    new MessagesPlaceholder('agent_scratchpad'),
  ])

  const outputParser = new XMLAgentOutputParser()

  const agent = RunnableSequence.from([
    {
      input: (i) => i.input,
      agent_scratchpad: (i) => formatXml(i.steps),
      chat_history: (i) => i.chat_history,
    },
    prompt,
    model,
    outputParser,
  ])

  const executor = AgentExecutor.fromAgentAndTools({
    agent,
    tools: [
      // - list repositories or projects
      // - find files to modify
      // - open pull request
    ],
  })

  const result = await executor.invoke({
    input: currentMessage.text,
    chat_history: chatHistory,
    outputParser,
  })

  return result.content[0].text
}
