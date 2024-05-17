import { ChatOpenAI, OpenAIChatInput } from '@langchain/openai'

let client: ChatOpenAI | null

export const createOpenAIChatClient = (
  options?: Partial<OpenAIChatInput>,
): ChatOpenAI => {
  if (client) {
    return client
  }

  client = new ChatOpenAI(options)
  return client
}
