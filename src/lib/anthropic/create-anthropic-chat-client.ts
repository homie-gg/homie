import { AnthropicInput, ChatAnthropic } from '@langchain/anthropic'

let client: ChatAnthropic | null

export const createAnthropicChatClient = (options: Partial<AnthropicInput>) => {
  if (client) {
    return client
  }

  client = new ChatAnthropic(options)

  return client
}
